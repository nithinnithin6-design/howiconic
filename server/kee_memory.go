package server

import (
	"database/sql"
	"fmt"
	"time"
)

// ─── KEE MEMORY — Cross-session user memory ───────────────────────────────────
// Kee remembers users across sessions: their name, brands built, choices made.
// Memory is best-effort — failures are silent so they never break the guide.

// Memory keys:
//   user_name        — their name (from registration)
//   brands_summary   — JSON list of brand names they've built
//   preferences      — things Kee learned (e.g., "prefers minimalist design")
//   interaction_count — how many times they've chatted with Kee
//   last_brand       — name of their most recent brand
//   notable_choices  — interesting choices they made (archetype, step selections)

type KeeMemory struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// getKeeMemory retrieves a single memory value for a user.
// Returns ("", nil) if the key doesn't exist.
func (s *Server) getKeeMemory(userID int64, key string) (string, error) {
	var value string
	err := s.db.QueryRow(
		"SELECT value FROM kee_memory WHERE user_id = ? AND key = ?",
		userID, key,
	).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

// setKeeMemory upserts a memory value for a user.
func (s *Server) setKeeMemory(userID int64, key, value string) error {
	_, err := s.db.Exec(`
		INSERT INTO kee_memory (user_id, key, value, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
	`, userID, key, value, value)
	return err
}

// getAllKeeMemories retrieves all memories for a user as a map.
func (s *Server) getAllKeeMemories(userID int64) (map[string]string, error) {
	rows, err := s.db.Query(
		"SELECT key, value FROM kee_memory WHERE user_id = ?",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	memories := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			continue
		}
		memories[k] = v
	}
	return memories, nil
}

// buildKeeMemoryContext creates a context string to inject into Kee's system prompt.
// Returns "" if no memories exist or on error — caller should handle gracefully.
func (s *Server) buildKeeMemoryContext(userID int64) string {
	memories, err := s.getAllKeeMemories(userID)
	if err != nil || len(memories) == 0 {
		return ""
	}

	ctx := "\n\nWHAT YOU REMEMBER ABOUT THIS USER:\n"

	if name, ok := memories["user_name"]; ok && name != "" {
		ctx += "- Their name is " + name + "\n"
	}
	if lastBrand, ok := memories["last_brand"]; ok && lastBrand != "" {
		ctx += "- Their most recent brand: " + lastBrand + "\n"
	}
	if brands, ok := memories["brands_summary"]; ok && brands != "" {
		ctx += "- Brands they've built: " + brands + "\n"
	}
	if prefs, ok := memories["preferences"]; ok && prefs != "" {
		ctx += "- What you know about them: " + prefs + "\n"
	}
	if notable, ok := memories["notable_choices"]; ok && notable != "" {
		ctx += "- Notable choices: " + notable + "\n"
	}
	if count, ok := memories["interaction_count"]; ok && count != "" {
		ctx += "- You've had " + count + " conversations with them\n"
	}

	ctx += "Use this knowledge naturally. Don't announce that you remember — just reference it when relevant. " +
		"If they built a brand before, you might say 'Last time you went with the Sage archetype — want to explore something different?'\n"

	return ctx
}

// incrementInteractionCount bumps the chat interaction counter for a user.
// Best-effort — never returns an error to the caller.
func (s *Server) incrementInteractionCount(userID int64) {
	countStr, _ := s.getKeeMemory(userID, "interaction_count")
	count := 0
	if countStr != "" {
		fmt.Sscanf(countStr, "%d", &count)
	}
	count++
	s.setKeeMemory(userID, "interaction_count", fmt.Sprintf("%d", count)) //nolint
}

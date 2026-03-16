package server

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"
)

// BrandAsset represents a brand asset stored in the vault.
type BrandAsset struct {
	ID         int64           `json:"id"`
	BrandID    int64           `json:"brand_id"`
	AssetType  string          `json:"asset_type"`
	FilePath   string          `json:"file_path,omitempty"`
	FileFormat string          `json:"file_format,omitempty"`
	Version    int             `json:"version"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
	CreatedAt  string          `json:"created_at"`
}

// BrandKitLink represents a shareable brand kit link.
type BrandKitLink struct {
	ID          int64  `json:"id"`
	BrandID     int64  `json:"brand_id"`
	Token       string `json:"token"`
	Permissions string `json:"permissions"`
	ExpiresAt   string `json:"expires_at,omitempty"`
	ShareURL    string `json:"share_url"`
	CreatedAt   string `json:"created_at"`
}

// generateToken creates a random URL-safe token.
func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// GET /api/brands/:id/assets
// Lists all assets for a brand.
func (s *Server) handleListAssets(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Verify brand ownership
	var numericID int64
	err := s.db.QueryRow(
		"SELECT id FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		brandID, brandID, userID,
	).Scan(&numericID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	rows, err := s.db.Query(`
		SELECT id, brand_id, asset_type, COALESCE(file_path,''), COALESCE(file_format,''),
		       version, COALESCE(metadata,'{}'), created_at
		FROM brand_assets
		WHERE brand_id = ?
		ORDER BY created_at DESC
	`, numericID)
	if err != nil {
		writeError(w, 500, "Failed to fetch assets")
		return
	}
	defer rows.Close()

	assets := []BrandAsset{}
	for rows.Next() {
		var a BrandAsset
		var meta string
		if err := rows.Scan(&a.ID, &a.BrandID, &a.AssetType, &a.FilePath, &a.FileFormat,
			&a.Version, &meta, &a.CreatedAt); err != nil {
			continue
		}
		a.Metadata = json.RawMessage(meta)
		assets = append(assets, a)
	}
	writeJSON(w, 200, assets)
}

// POST /api/brands/:id/share
// Creates a shareable brand kit link.
func (s *Server) handleCreateShare(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Verify brand ownership
	var numericID int64
	var brandName string
	err := s.db.QueryRow(
		"SELECT id, name FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		brandID, brandID, userID,
	).Scan(&numericID, &brandName)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	var req struct {
		Permissions string `json:"permissions"` // view | download
		ExpiresIn   int    `json:"expires_in"`  // hours; 0 = no expiry
	}
	// Best-effort decode; defaults are fine if body is empty
	decodeJSON(r, &req)

	if req.Permissions == "" {
		req.Permissions = "view"
	}

	token := generateToken()

	var expiresAt *time.Time
	if req.ExpiresIn > 0 {
		t := time.Now().UTC().Add(time.Duration(req.ExpiresIn) * time.Hour)
		expiresAt = &t
	}

	var expiresStr interface{}
	if expiresAt != nil {
		expiresStr = expiresAt.Format(time.RFC3339)
	}

	_, err = s.db.Exec(
		`INSERT INTO brand_kit_links (brand_id, token, permissions, expires_at)
		 VALUES (?, ?, ?, ?)`,
		numericID, token, req.Permissions, expiresStr,
	)
	if err != nil {
		writeError(w, 500, "Failed to create share link")
		return
	}

	link := BrandKitLink{
		BrandID:     numericID,
		Token:       token,
		Permissions: req.Permissions,
		ShareURL:    "/api/share/" + token,
	}
	if expiresAt != nil {
		link.ExpiresAt = expiresAt.Format(time.RFC3339)
	}

	writeJSON(w, 201, link)
}

// GET /api/share/:token
// Public brand kit view — no authentication required.
func (s *Server) handlePublicShare(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	token := extractIDFromPath(r.URL.Path, "/api/share/")
	if token == "" {
		writeError(w, 400, "Missing token")
		return
	}

	var linkID int64
	var brandID int64
	var permissions string
	var expiresAt *string

	err := s.db.QueryRow(`
		SELECT id, brand_id, permissions, expires_at
		FROM brand_kit_links
		WHERE token = ?
	`, token).Scan(&linkID, &brandID, &permissions, &expiresAt)
	if err != nil {
		writeError(w, 404, "Share link not found or expired")
		return
	}

	// Check expiry
	if expiresAt != nil && *expiresAt != "" {
		exp, err := time.Parse(time.RFC3339, *expiresAt)
		if err == nil && time.Now().UTC().After(exp) {
			writeError(w, 410, "Share link has expired")
			return
		}
	}

	// Fetch brand data (public — no user_id check)
	var name, uid, dataStr string
	err = s.db.QueryRow(
		"SELECT name, uid, brand_data FROM brands WHERE id = ?", brandID,
	).Scan(&name, &uid, &dataStr)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	// Fetch assets
	rows, err := s.db.Query(`
		SELECT id, asset_type, COALESCE(file_path,''), COALESCE(file_format,''), version, COALESCE(metadata,'{}'), created_at
		FROM brand_assets WHERE brand_id = ? ORDER BY created_at DESC
	`, brandID)
	if err != nil {
		writeError(w, 500, "Failed to fetch assets")
		return
	}
	defer rows.Close()

	assets := []BrandAsset{}
	for rows.Next() {
		var a BrandAsset
		var meta string
		if err := rows.Scan(&a.ID, &a.AssetType, &a.FilePath, &a.FileFormat, &a.Version, &meta, &a.CreatedAt); err != nil {
			continue
		}
		a.BrandID = brandID
		a.Metadata = json.RawMessage(meta)
		assets = append(assets, a)
	}

	writeJSON(w, 200, map[string]interface{}{
		"brand": map[string]interface{}{
			"id":         brandID,
			"name":       name,
			"uid":        uid,
			"brand_data": json.RawMessage(dataStr),
		},
		"assets":      assets,
		"permissions": permissions,
	})
}

package server

import (
	"encoding/json"
	"net/http"
	"strings"
)

// BrandArchitectureNode is a brand with its children for tree responses.
type BrandArchitectureNode struct {
	ID               int64                   `json:"id"`
	Name             string                  `json:"name"`
	UID              string                  `json:"uid"`
	BrandType        string                  `json:"brand_type"`
	RelationshipType string                  `json:"relationship_type,omitempty"`
	Position         int                     `json:"position,omitempty"`
	BrandData        json.RawMessage         `json:"brand_data"`
	Children         []BrandArchitectureNode `json:"children"`
}

// POST /api/brands/:id/sub-brand
// Creates a new brand linked to the given parent brand.
func (s *Server) handleCreateSubBrand(w http.ResponseWriter, r *http.Request, parentID string, userID int64) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Resolve parent brand ID (numeric)
	var parentNumericID int64
	err := s.db.QueryRow(
		"SELECT id FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		parentID, parentID, userID,
	).Scan(&parentNumericID)
	if err != nil {
		writeError(w, 404, "Parent brand not found")
		return
	}

	var req struct {
		Name             string          `json:"name"`
		BrandData        json.RawMessage `json:"brand_data"`
		RelationshipType string          `json:"relationship_type"` // parent, endorsed, sub-brand
		Position         int             `json:"position"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	if req.RelationshipType == "" {
		req.RelationshipType = "sub-brand"
	}

	uid := generateUID()
	dataStr := "{}"
	if req.BrandData != nil {
		dataStr = string(req.BrandData)
	}

	// Create the child brand
	result, err := s.db.Exec(
		`INSERT INTO brands (user_id, name, uid, brand_data, parent_brand_id, brand_type)
		 VALUES (?, ?, ?, ?, ?, 'sub-brand')`,
		userID, req.Name, uid, dataStr, parentNumericID,
	)
	if err != nil {
		writeError(w, 500, "Failed to create sub-brand")
		return
	}
	childID, _ := result.LastInsertId()

	// Link in architecture table
	_, err = s.db.Exec(
		`INSERT INTO brand_architecture (parent_brand_id, child_brand_id, relationship_type, position)
		 VALUES (?, ?, ?, ?)`,
		parentNumericID, childID, req.RelationshipType, req.Position,
	)
	if err != nil {
		writeError(w, 500, "Failed to create brand architecture link")
		return
	}

	writeJSON(w, 201, map[string]interface{}{
		"id":                childID,
		"uid":               uid,
		"name":              req.Name,
		"parent_brand_id":   parentNumericID,
		"relationship_type": req.RelationshipType,
		"brand_data":        req.BrandData,
	})
}

// GET /api/brands/:id/architecture
// Returns the brand tree: parent (or self if root) + all children recursively.
func (s *Server) handleGetArchitecture(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Resolve to numeric ID
	var numericID int64
	var parentBrandID *int64
	var name, uid, brandType, dataStr string
	err := s.db.QueryRow(
		`SELECT id, name, uid, COALESCE(brand_type,'standalone'), brand_data, parent_brand_id
		 FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?`,
		brandID, brandID, userID,
	).Scan(&numericID, &name, &uid, &brandType, &dataStr, &parentBrandID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	// Walk up to the root
	rootID := numericID
	if parentBrandID != nil {
		rootID = findRoot(s, *parentBrandID)
	}

	// Build tree from root
	tree := buildBrandTree(s, rootID, userID, "")
	writeJSON(w, 200, tree)
}

// findRoot walks up the brand hierarchy to find the root brand ID.
func findRoot(s *Server, brandID int64) int64 {
	var parentID *int64
	s.db.QueryRow("SELECT parent_brand_id FROM brands WHERE id = ?", brandID).Scan(&parentID)
	if parentID == nil {
		return brandID
	}
	return findRoot(s, *parentID)
}

// buildBrandTree recursively builds the brand tree from a given root.
func buildBrandTree(s *Server, brandID int64, userID int64, relationshipType string) BrandArchitectureNode {
	node := BrandArchitectureNode{
		Children:         []BrandArchitectureNode{},
		RelationshipType: relationshipType,
	}

	var dataStr string
	s.db.QueryRow(
		`SELECT id, name, uid, COALESCE(brand_type,'standalone'), brand_data
		 FROM brands WHERE id = ? AND user_id = ?`,
		brandID, userID,
	).Scan(&node.ID, &node.Name, &node.UID, &node.BrandType, &dataStr)
	node.BrandData = json.RawMessage(dataStr)

	// Fetch direct children via brand_architecture
	rows, err := s.db.Query(
		`SELECT ba.child_brand_id, ba.relationship_type, ba.position
		 FROM brand_architecture ba
		 WHERE ba.parent_brand_id = ?
		 ORDER BY ba.position ASC`,
		brandID,
	)
	if err != nil {
		return node
	}
	defer rows.Close()

	for rows.Next() {
		var childID int64
		var relType string
		var pos int
		if err := rows.Scan(&childID, &relType, &pos); err != nil {
			continue
		}
		child := buildBrandTree(s, childID, userID, relType)
		child.Position = pos
		node.Children = append(node.Children, child)
	}

	return node
}

// brandIDFromPath extracts the brand ID and optional sub-path from a URL like /api/brands/42/foo.
// Returns (brandID, subPath). If no subPath, returns ("", "").
func brandIDFromPath(path, prefix string) (string, string) {
	trimmed := strings.TrimPrefix(path, prefix)
	parts := strings.SplitN(trimmed, "/", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return trimmed, ""
}

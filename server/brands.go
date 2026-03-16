package server

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"
)

func generateUID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

type Brand struct {
	ID        int64           `json:"id"`
	UserID    int64           `json:"user_id"`
	Name      string          `json:"name"`
	UID       string          `json:"uid"`
	BrandData json.RawMessage `json:"brand_data"`
	CreatedAt string          `json:"created_at"`
	UpdatedAt string          `json:"updated_at"`
}

func (s *Server) handleBrands(w http.ResponseWriter, r *http.Request) {
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	switch r.Method {
	case "GET":
		s.listBrands(w, claims.UserID)
	case "POST":
		s.createBrand(w, r, claims.UserID)
	default:
		writeError(w, 405, "Method not allowed")
	}
}

func (s *Server) handleBrandByID(w http.ResponseWriter, r *http.Request) {
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	// path after /api/brands/ — may be "42", "42/sub-brand", "42/architecture", etc.
	brandID, subPath := brandIDFromPath(r.URL.Path, "/api/brands/")
	if brandID == "" {
		writeError(w, 400, "Missing brand ID")
		return
	}

	// Route sub-paths to dedicated handlers
	switch subPath {
	case "sub-brand":
		s.handleCreateSubBrand(w, r, brandID, claims.UserID)
		return
	case "architecture":
		s.handleGetArchitecture(w, r, brandID, claims.UserID)
		return
	case "assets":
		s.handleListAssets(w, r, brandID, claims.UserID)
		return
	case "share":
		s.handleCreateShare(w, r, brandID, claims.UserID)
		return
	}

	switch r.Method {
	case "GET":
		s.getBrand(w, brandID, claims.UserID)
	case "PUT":
		s.updateBrand(w, r, brandID, claims.UserID)
	case "DELETE":
		s.deleteBrand(w, brandID, claims.UserID)
	default:
		writeError(w, 405, "Method not allowed")
	}
}

func (s *Server) listBrands(w http.ResponseWriter, userID int64) {
	rows, err := s.db.Query(
		"SELECT id, name, uid, brand_data, created_at, updated_at FROM brands WHERE user_id = ? ORDER BY updated_at DESC",
		userID)
	if err != nil {
		writeError(w, 500, "Failed to fetch brands")
		return
	}
	defer rows.Close()

	brands := []Brand{}
	for rows.Next() {
		var b Brand
		var data string
		if err := rows.Scan(&b.ID, &b.Name, &b.UID, &data, &b.CreatedAt, &b.UpdatedAt); err != nil {
			continue
		}
		b.BrandData = json.RawMessage(data)
		b.UserID = userID
		brands = append(brands, b)
	}
	writeJSON(w, 200, brands)
}

func (s *Server) createBrand(w http.ResponseWriter, r *http.Request, userID int64) {
	var req struct {
		Name      string          `json:"name"`
		BrandData json.RawMessage `json:"brand_data"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	uid := generateUID()
	dataStr := "{}"
	if req.BrandData != nil {
		dataStr = string(req.BrandData)
	}

	result, err := s.db.Exec(
		"INSERT INTO brands (user_id, name, uid, brand_data) VALUES (?, ?, ?, ?)",
		userID, req.Name, uid, dataStr)
	if err != nil {
		writeError(w, 500, "Failed to create brand")
		return
	}

	id, _ := result.LastInsertId()
	writeJSON(w, 201, map[string]interface{}{
		"id":         id,
		"uid":        uid,
		"name":       req.Name,
		"brand_data": req.BrandData,
		"created_at": time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) getBrand(w http.ResponseWriter, id string, userID int64) {
	var b Brand
	var data string
	err := s.db.QueryRow(
		"SELECT id, name, uid, brand_data, created_at, updated_at FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		id, id, userID).Scan(&b.ID, &b.Name, &b.UID, &data, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}
	b.BrandData = json.RawMessage(data)
	b.UserID = userID
	writeJSON(w, 200, b)
}

func (s *Server) updateBrand(w http.ResponseWriter, r *http.Request, id string, userID int64) {
	var req struct {
		Name      *string          `json:"name"`
		BrandData *json.RawMessage `json:"brand_data"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	// Check ownership
	var existingID int64
	err := s.db.QueryRow("SELECT id FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?", id, id, userID).Scan(&existingID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	if req.Name != nil {
		s.db.Exec("UPDATE brands SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", *req.Name, existingID)
	}
	if req.BrandData != nil {
		s.db.Exec("UPDATE brands SET brand_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", string(*req.BrandData), existingID)
	}

	writeJSON(w, 200, map[string]string{"status": "updated"})
}

func (s *Server) deleteBrand(w http.ResponseWriter, id string, userID int64) {
	result, err := s.db.Exec("DELETE FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?", id, id, userID)
	if err != nil {
		writeError(w, 500, "Failed to delete brand")
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, 404, "Brand not found")
		return
	}
	writeJSON(w, 200, map[string]string{"status": "deleted"})
}

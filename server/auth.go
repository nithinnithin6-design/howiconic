package server

import (
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserClaims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func (s *Server) createToken(userID int64, email string) (string, error) {
	claims := UserClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

func (s *Server) validateToken(tokenStr string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}

func (s *Server) authenticate(r *http.Request) (*UserClaims, error) {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return nil, jwt.ErrSignatureInvalid
	}
	tokenStr := strings.TrimPrefix(auth, "Bearer ")
	return s.validateToken(tokenStr)
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, 400, "Email and password are required")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, 400, "Password must be at least 6 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, 500, "Internal error")
		return
	}

	result, err := s.db.Exec("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
		strings.ToLower(strings.TrimSpace(req.Email)), string(hash), req.Name)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeError(w, 409, "Email already registered")
			return
		}
		writeError(w, 500, "Failed to create user")
		return
	}

	userID, _ := result.LastInsertId()
	token, err := s.createToken(userID, req.Email)
	if err != nil {
		writeError(w, 500, "Failed to create session")
		return
	}

	writeJSON(w, 201, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":    userID,
			"email": req.Email,
			"name":  req.Name,
		},
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	var userID int64
	var passwordHash, name string
	email := strings.ToLower(strings.TrimSpace(req.Email))
	err := s.db.QueryRow("SELECT id, password_hash, name FROM users WHERE email = ?", email).
		Scan(&userID, &passwordHash, &name)
	if err != nil {
		writeError(w, 401, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		writeError(w, 401, "Invalid email or password")
		return
	}

	token, err := s.createToken(userID, email)
	if err != nil {
		writeError(w, 500, "Failed to create session")
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":    userID,
			"email": email,
			"name":  name,
		},
	})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	var name string
	var generationsCount int
	var plan string
	err = s.db.QueryRow("SELECT name, COALESCE(generations_count, 0), COALESCE(plan, 'explorer') FROM users WHERE id = ?", claims.UserID).
		Scan(&name, &generationsCount, &plan)
	if err != nil {
		writeError(w, 404, "User not found")
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"id":                claims.UserID,
		"email":             claims.Email,
		"name":              name,
		"generations_count": generationsCount,
		"plan":              plan,
	})
}

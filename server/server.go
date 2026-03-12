package server

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

type Config struct {
	Port      string
	DBPath    string
	JWTSecret string
	GeminiKey string
	StaticDir string
}

type Server struct {
	db        *sql.DB
	config    Config
	mux       *http.ServeMux
}

func New(cfg Config) (*Server, error) {
	db, err := sql.Open("sqlite3", cfg.DBPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}

	if err := migrate(db); err != nil {
		db.Close()
		return nil, err
	}

	s := &Server{
		db:     db,
		config: cfg,
		mux:    http.NewServeMux(),
	}

	s.registerRoutes()
	return s, nil
}

func (s *Server) Close() {
	s.db.Close()
}

func (s *Server) Handler() http.Handler {
	return corsMiddleware(s.mux)
}

func (s *Server) registerRoutes() {
	// Auth
	s.mux.HandleFunc("/api/auth/register", s.handleRegister)
	s.mux.HandleFunc("/api/auth/login", s.handleLogin)
	s.mux.HandleFunc("/api/auth/me", s.handleMe)

	// Brands
	s.mux.HandleFunc("/api/brands", s.handleBrands)
	s.mux.HandleFunc("/api/brands/", s.handleBrandByID)

	// Generate (Gemini proxy)
	s.mux.HandleFunc("/api/generate/brand", s.handleGenerateBrand)
	s.mux.HandleFunc("/api/generate/audit", s.handleGenerateAudit)
	s.mux.HandleFunc("/api/generate/mockup", s.handleGenerateMockup)
	s.mux.HandleFunc("/api/generate/logo", s.handleGenerateLogo)

	// Health
	s.mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})

	// Static files (React frontend)
	staticDir := s.config.StaticDir
	if staticDir != "" {
		s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Serve static files; fallback to index.html for SPA routing
			path := filepath.Join(staticDir, r.URL.Path)
			if r.URL.Path == "/" || !fileExists(path) {
				http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
				return
			}
			http.FileServer(http.Dir(staticDir)).ServeHTTP(w, r)
		})
	}
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		}
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")

		next.ServeHTTP(w, r)
	})
}

// extractIDFromPath gets the ID from /api/brands/{id}
func extractIDFromPath(path, prefix string) string {
	s := strings.TrimPrefix(path, prefix)
	s = strings.TrimSuffix(s, "/")
	return s
}

package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"howiconic/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3800"
	}

	geminiKey := os.Getenv("GEMINI_API_KEY")
	if geminiKey == "" {
		log.Println("[WARN] GEMINI_API_KEY not set — generate endpoints will fail")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "howiconic-dev-secret-change-me"
		log.Println("[WARN] JWT_SECRET not set — using dev default")
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "howiconic.db"
	}

	srv, err := server.New(server.Config{
		Port:      port,
		DBPath:    dbPath,
		JWTSecret: jwtSecret,
		GeminiKey: geminiKey,
		StaticDir: "static",
	})
	if err != nil {
		log.Fatalf("[FATAL] Failed to initialize server: %v", err)
	}
	defer srv.Close()

	addr := fmt.Sprintf(":%s", port)
	fmt.Printf("[HowIconic] Server running on http://0.0.0.0%s\n", addr)
	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		log.Fatalf("[FATAL] %v", err)
	}
}

package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

func (s *Server) handleTTS(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Require auth to rate-limit TTS usage
	_, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	var req struct {
		Text string `json:"text"`
	}
	if err := decodeJSON(r, &req); err != nil || req.Text == "" {
		writeError(w, 400, "text is required")
		return
	}

	// Limit text length
	if len(req.Text) > 1000 {
		req.Text = req.Text[:1000]
	}

	// Call OpenAI TTS API
	apiKey := s.openaiKey
	if apiKey == "" {
		writeError(w, 500, "TTS not configured")
		return
	}

	body, _ := json.Marshal(map[string]interface{}{
		"model": "tts-1",
		"input": req.Text,
		"voice": "nova",
		"speed": 0.95,
	})

	apiReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/audio/speech", bytes.NewReader(body))
	apiReq.Header.Set("Authorization", "Bearer "+apiKey)
	apiReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(apiReq)
	if err != nil {
		writeError(w, 500, "TTS request failed")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		errBody, _ := io.ReadAll(resp.Body)
		writeError(w, 500, fmt.Sprintf("TTS API error: %s", string(errBody)))
		return
	}

	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Cache-Control", "no-cache")
	io.Copy(w, resp.Body)
}

func (s *Server) handleTranscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	_, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	apiKey := s.openaiKey
	if apiKey == "" {
		writeError(w, 500, "Transcription not configured")
		return
	}

	// Parse multipart form (max 25MB — Whisper limit)
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		writeError(w, 400, "Invalid form data")
		return
	}

	file, header, err := r.FormFile("audio")
	if err != nil {
		writeError(w, 400, "audio file required")
		return
	}
	defer file.Close()

	// Build multipart request to OpenAI
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add the audio file
	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		writeError(w, 500, "Failed to create form")
		return
	}
	if _, err := io.Copy(part, file); err != nil {
		writeError(w, 500, "Failed to read audio")
		return
	}

	// Add model field
	writer.WriteField("model", "whisper-1")
	writer.Close()

	apiReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/audio/transcriptions", &buf)
	apiReq.Header.Set("Authorization", "Bearer "+apiKey)
	apiReq.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(apiReq)
	if err != nil {
		writeError(w, 500, "Transcription request failed")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		errBody, _ := io.ReadAll(resp.Body)
		writeError(w, 500, fmt.Sprintf("Transcription API error: %s", string(errBody)))
		return
	}

	var result struct {
		Text string `json:"text"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	writeJSON(w, 200, result)
}

package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// DalleLogo represents a single DALL-E generated logo
type DalleLogo struct {
	Style     string `json:"style"`
	ImageData string `json:"imageData"` // data:image/png;base64,...
}

// dalleRequest is the OpenAI images/generations request body
type dalleRequest struct {
	Model          string `json:"model"`
	Prompt         string `json:"prompt"`
	N              int    `json:"n"`
	Size           string `json:"size"`
	Quality        string `json:"quality"`
	ResponseFormat string `json:"response_format"`
}

// dalleResponse is the OpenAI images/generations response
type dalleResponse struct {
	Data []struct {
		B64JSON string `json:"b64_json"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error"`
}

// generateLogoDallE calls DALL-E 3 three times with varied prompts and returns
// three DalleLogo entries. If the API key is missing or any call fails, it
// returns nil, nil (caller falls back to SVGs silently).
func (s *Server) generateLogoDallE(
	brandName, tagline, concept, primaryColor, secondaryColor, vibe string,
) ([]DalleLogo, error) {
	if s.openaiKey == "" {
		log.Printf("[dalle] No OpenAI API key set — skipping DALL-E logo generation")
		return nil, nil
	}

	styles := []struct {
		name   string
		suffix string
	}{
		{"geometric", "minimal geometric symbol — clean shapes, mathematical precision, scalable at any size"},
		{"conceptual", "abstract conceptual mark — evocative, suggests meaning without spelling it out"},
		{"emblem", "bold iconic emblem — strong, confident, instantly recognizable"},
	}

	basePrompt := fmt.Sprintf(
		"Design a professional brand logo mark for '%s'. "+
			"Brand concept: %s. "+
			"Style: %s, %s, modern. "+
			"Colors: %s and %s on a pure white background. "+
			"IMPORTANT: SYMBOL/ICON ONLY — absolutely NO text, NO letters, NO words, NO brand name. "+
			"Clean vector-style illustration, isolated on white, suitable for business use. "+
			"Think FedEx arrow, Nike swoosh, Apple apple — iconic, simple, meaningful. "+
			"The symbol should work at 16px and 500px alike.",
		brandName, concept, vibe, "%s", primaryColor, secondaryColor,
	)

	var logos []DalleLogo
	client := &http.Client{Timeout: 60 * time.Second}

	for _, style := range styles {
		prompt := fmt.Sprintf(basePrompt, style.suffix)

		reqBody := dalleRequest{
			Model:          "dall-e-3",
			Prompt:         prompt,
			N:              1,
			Size:           "1024x1024",
			Quality:        "standard",
			ResponseFormat: "b64_json",
		}

		bodyBytes, err := json.Marshal(reqBody)
		if err != nil {
			log.Printf("[dalle] Marshal error for style %s: %v", style.name, err)
			continue
		}

		req, err := http.NewRequest("POST", "https://api.openai.com/v1/images/generations", bytes.NewReader(bodyBytes))
		if err != nil {
			log.Printf("[dalle] Request build error for style %s: %v", style.name, err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+s.openaiKey)

		log.Printf("[dalle] Calling DALL-E 3 for style=%s brand=%q", style.name, brandName)
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[dalle] HTTP error for style %s: %v", style.name, err)
			continue
		}

		respBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			log.Printf("[dalle] Read error for style %s: %v", style.name, err)
			continue
		}

		if resp.StatusCode != 200 {
			log.Printf("[dalle] Non-200 response for style %s: status=%d body=%s", style.name, resp.StatusCode, string(respBytes))
			continue
		}

		var dalleResp dalleResponse
		if err := json.Unmarshal(respBytes, &dalleResp); err != nil {
			log.Printf("[dalle] Parse error for style %s: %v", style.name, err)
			continue
		}

		if dalleResp.Error != nil {
			log.Printf("[dalle] API error for style %s: %s (%s)", style.name, dalleResp.Error.Message, dalleResp.Error.Code)
			continue
		}

		if len(dalleResp.Data) == 0 || dalleResp.Data[0].B64JSON == "" {
			log.Printf("[dalle] Empty response data for style %s", style.name)
			continue
		}

		logos = append(logos, DalleLogo{
			Style:     style.name,
			ImageData: "data:image/png;base64," + dalleResp.Data[0].B64JSON,
		})
		log.Printf("[dalle] Got logo for style=%s (len=%d)", style.name, len(dalleResp.Data[0].B64JSON))
	}

	if len(logos) == 0 {
		log.Printf("[dalle] All DALL-E calls failed — returning nil (SVG fallback will be used)")
		return nil, nil
	}

	return logos, nil
}

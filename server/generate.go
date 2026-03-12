package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const geminiAPIURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig map[string]interface{} `json:"generationConfig,omitempty"`
	SystemInstruction *geminiContent        `json:"systemInstruction,omitempty"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text,omitempty"`
}

func (s *Server) callGemini(systemPrompt, userPrompt string, jsonMode bool) (string, error) {
	if s.config.GeminiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY not configured")
	}

	req := geminiRequest{
		Contents: []geminiContent{
			{Role: "user", Parts: []geminiPart{{Text: userPrompt}}},
		},
	}

	if systemPrompt != "" {
		req.SystemInstruction = &geminiContent{
			Parts: []geminiPart{{Text: systemPrompt}},
		}
	}

	if jsonMode {
		req.GenerationConfig = map[string]interface{}{
			"responseMimeType": "application/json",
		}
	}

	body, _ := json.Marshal(req)
	url := fmt.Sprintf("%s?key=%s", geminiAPIURL, s.config.GeminiKey)

	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to call Gemini: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Gemini API error (%d): %s", resp.StatusCode, string(respBody))
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func (s *Server) handleGenerateBrand(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}
	_ = claims

	var req struct {
		Prompt    string          `json:"prompt"`
		Context   json.RawMessage `json:"context"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	systemPrompt := `You are HowIconic, an expert brand identity AI. Generate a comprehensive brand identity based on the user's input. Return a JSON object with these fields:
{
  "brand_name": "string",
  "tagline": "string",
  "mission": "string",
  "vision": "string",
  "values": ["string"],
  "personality": {
    "traits": ["string"],
    "tone": "string",
    "voice": "string"
  },
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "neutral": "#hex",
    "background": "#hex"
  },
  "typography": {
    "heading": "font name",
    "body": "font name"
  },
  "target_audience": {
    "demographics": "string",
    "psychographics": "string"
  },
  "brand_story": "string",
  "elevator_pitch": "string",
  "logo": {
    "template_id": "string (one of: circle-monogram, shield-badge, geometric-stack, minimal-wordmark, hexagon-icon, rounded-emblem, diamond-accent, split-block, arc-underline, dot-grid, triangle-peak, wave-flow, square-frame, ribbon-banner, orbit-ring)",
    "params": {
      "text": "string (1-3 chars for monogram, or full name)",
      "primary_color": "#hex",
      "secondary_color": "#hex",
      "accent_color": "#hex",
      "weight": "light|regular|bold",
      "style": "modern|classic|playful"
    }
  }
}`

	userPrompt := req.Prompt
	if req.Context != nil {
		userPrompt += "\n\nAdditional context: " + string(req.Context)
	}

	result, err := s.callGemini(systemPrompt, userPrompt, true)
	if err != nil {
		writeError(w, 502, err.Error())
		return
	}

	// Parse and return as structured JSON
	var brandData json.RawMessage
	if err := json.Unmarshal([]byte(result), &brandData); err != nil {
		// Return raw text if not valid JSON
		writeJSON(w, 200, map[string]interface{}{"raw": result})
		return
	}

	writeJSON(w, 200, map[string]interface{}{"brand": brandData})
}

func (s *Server) handleGenerateAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}
	_ = claims

	var req struct {
		URL       string          `json:"url"`
		BrandData json.RawMessage `json:"brand_data"`
		Input     string          `json:"input"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	systemPrompt := `You are HowIconic, a brand audit expert. Analyze the provided brand information and give a detailed audit. Return JSON:
{
  "overall_score": 0-100,
  "categories": [
    {
      "name": "string",
      "score": 0-100,
      "findings": ["string"],
      "recommendations": ["string"]
    }
  ],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "action_items": [
    {
      "priority": "high|medium|low",
      "action": "string",
      "impact": "string"
    }
  ],
  "summary": "string"
}`

	userPrompt := req.Input
	if req.URL != "" {
		userPrompt += "\n\nWebsite/URL to audit: " + req.URL
	}
	if req.BrandData != nil {
		userPrompt += "\n\nExisting brand data: " + string(req.BrandData)
	}

	result, err := s.callGemini(systemPrompt, userPrompt, true)
	if err != nil {
		writeError(w, 502, err.Error())
		return
	}

	var auditData json.RawMessage
	if err := json.Unmarshal([]byte(result), &auditData); err != nil {
		writeJSON(w, 200, map[string]interface{}{"raw": result})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"audit": auditData})
}

func (s *Server) handleGenerateMockup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}
	_ = claims

	var req struct {
		Type      string          `json:"type"`
		BrandData json.RawMessage `json:"brand_data"`
		Prompt    string          `json:"prompt"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	systemPrompt := `You are HowIconic, a brand mockup generator. Based on the brand data, generate a detailed description of how the brand would look on the requested mockup type. Return JSON:
{
  "mockup_type": "string",
  "description": "string",
  "layout": {
    "elements": [
      {
        "type": "text|shape|image",
        "content": "string",
        "position": "string",
        "style": "string"
      }
    ]
  },
  "css_preview": "string (inline CSS that could render a preview)"
}`

	userPrompt := fmt.Sprintf("Generate a %s mockup", req.Type)
	if req.Prompt != "" {
		userPrompt += ": " + req.Prompt
	}
	if req.BrandData != nil {
		userPrompt += "\n\nBrand data: " + string(req.BrandData)
	}

	result, err := s.callGemini(systemPrompt, userPrompt, true)
	if err != nil {
		writeError(w, 502, err.Error())
		return
	}

	var mockupData json.RawMessage
	if err := json.Unmarshal([]byte(result), &mockupData); err != nil {
		writeJSON(w, 200, map[string]interface{}{"raw": result})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"mockup": mockupData})
}

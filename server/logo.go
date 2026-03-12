package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type LogoParams struct {
	Text           string `json:"text"`
	PrimaryColor   string `json:"primary_color"`
	SecondaryColor string `json:"secondary_color"`
	AccentColor    string `json:"accent_color"`
	Weight         string `json:"weight"`
	Style          string `json:"style"`
}

type LogoRequest struct {
	TemplateID string     `json:"template_id"`
	Params     LogoParams `json:"params"`
}

func (s *Server) handleGenerateLogo(w http.ResponseWriter, r *http.Request) {
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
		TemplateID string          `json:"template_id"`
		Params     LogoParams      `json:"params"`
		Prompt     string          `json:"prompt"`
		Auto       bool            `json:"auto"`
		BrandData  json.RawMessage `json:"brand_data"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	// If auto mode, ask Gemini to pick template + params
	if req.Auto && req.Prompt != "" {
		templateList := getTemplateList()
		systemPrompt := fmt.Sprintf(`You are a logo design AI. Pick the best logo template and parameters for the brand. Available templates: %s

Return JSON:
{
  "template_id": "string",
  "params": {
    "text": "string (1-3 chars for monogram templates, full name for wordmark)",
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "accent_color": "#hex",
    "weight": "light|regular|bold",
    "style": "modern|classic|playful"
  },
  "reasoning": "string"
}`, templateList)

		userPrompt := req.Prompt
		if req.BrandData != nil {
			userPrompt += "\n\nBrand data: " + string(req.BrandData)
		}

		result, err := s.callGemini(systemPrompt, userPrompt, true)
		if err != nil {
			writeError(w, 502, err.Error())
			return
		}

		var logoChoice struct {
			TemplateID string     `json:"template_id"`
			Params     LogoParams `json:"params"`
			Reasoning  string     `json:"reasoning"`
		}
		if err := json.Unmarshal([]byte(result), &logoChoice); err != nil {
			writeError(w, 502, "Failed to parse AI response")
			return
		}

		req.TemplateID = logoChoice.TemplateID
		req.Params = logoChoice.Params
	}

	// Render SVG from template
	svg, err := renderLogo(req.TemplateID, req.Params)
	if err != nil {
		writeError(w, 400, err.Error())
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"svg":         svg,
		"template_id": req.TemplateID,
		"params":      req.Params,
	})
}

func getTemplateList() string {
	templates := []string{
		"circle-monogram: Circle with centered monogram text",
		"shield-badge: Shield/crest shape with text",
		"geometric-stack: Stacked geometric shapes with text below",
		"minimal-wordmark: Clean minimal text-only logo",
		"hexagon-icon: Hexagonal frame with icon/letter",
		"rounded-emblem: Rounded rectangle emblem with text",
		"diamond-accent: Diamond shape accent with text",
		"split-block: Split color block with text",
		"arc-underline: Text with decorative arc underline",
		"dot-grid: Dotted pattern forming a letter/shape",
		"triangle-peak: Triangle/mountain peak with text",
		"wave-flow: Flowing wave element with text",
		"square-frame: Square frame border with centered text",
		"ribbon-banner: Banner/ribbon style with text",
		"orbit-ring: Orbital ring around text/letter",
	}
	return strings.Join(templates, "\n")
}

func defaults(val, def string) string {
	if val == "" {
		return def
	}
	return val
}

func fontWeight(weight string) string {
	switch weight {
	case "light":
		return "300"
	case "bold":
		return "700"
	default:
		return "400"
	}
}

func renderLogo(templateID string, p LogoParams) (string, error) {
	primary := defaults(p.PrimaryColor, "#2563EB")
	secondary := defaults(p.SecondaryColor, "#1E40AF")
	accent := defaults(p.AccentColor, "#F59E0B")
	text := defaults(p.Text, "A")
	fw := fontWeight(p.Weight)

	// Ensure text is trimmed
	displayText := text
	monogramText := text
	if len(monogramText) > 3 {
		monogramText = string([]rune(monogramText)[:3])
	}

	switch templateID {
	case "circle-monogram":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="90" fill="%s"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="%s" stroke-width="2"/>
  <text x="100" y="108" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="64" font-weight="%s">%s</text>
</svg>`, primary, accent, fw, monogramText), nil

	case "shield-badge":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <path d="M100 10 L185 50 L185 140 Q185 200 100 230 Q15 200 15 140 L15 50 Z" fill="%s"/>
  <path d="M100 25 L170 60 L170 135 Q170 190 100 215 Q30 190 30 135 L30 60 Z" fill="%s"/>
  <text x="100" y="130" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="48" font-weight="%s">%s</text>
</svg>`, primary, secondary, fw, monogramText), nil

	case "geometric-stack":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <rect x="40" y="10" width="50" height="50" rx="8" fill="%s"/>
  <rect x="110" y="10" width="50" height="50" rx="8" fill="%s"/>
  <rect x="40" y="70" width="50" height="50" rx="8" fill="%s"/>
  <rect x="110" y="70" width="50" height="50" rx="8" fill="%s"/>
  <text x="100" y="170" text-anchor="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="32" font-weight="%s">%s</text>
</svg>`, primary, accent, accent, primary, primary, fw, displayText), nil

	case "minimal-wordmark":
		fontSize := "40"
		if len(displayText) > 10 {
			fontSize = "28"
		} else if len(displayText) > 6 {
			fontSize = "34"
		}
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <text x="150" y="48" text-anchor="middle" dominant-baseline="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="%s" font-weight="%s" letter-spacing="4">%s</text>
  <line x1="20" y1="65" x2="280" y2="65" stroke="%s" stroke-width="2"/>
</svg>`, primary, fontSize, fw, strings.ToUpper(displayText), accent), nil

	case "hexagon-icon":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230" width="200" height="230">
  <polygon points="100,10 185,55 185,145 100,190 15,145 15,55" fill="%s"/>
  <polygon points="100,25 170,63 170,137 100,175 30,137 30,63" fill="%s"/>
  <text x="100" y="108" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="56" font-weight="%s">%s</text>
</svg>`, primary, secondary, fw, monogramText), nil

	case "rounded-emblem":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100" width="260" height="100">
  <rect x="5" y="5" width="250" height="90" rx="45" fill="%s"/>
  <rect x="10" y="10" width="240" height="80" rx="40" fill="none" stroke="%s" stroke-width="2"/>
  <text x="130" y="58" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="32" font-weight="%s" letter-spacing="3">%s</text>
</svg>`, primary, accent, fw, strings.ToUpper(displayText)), nil

	case "diamond-accent":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect x="60" y="60" width="80" height="80" rx="4" transform="rotate(45 100 100)" fill="%s"/>
  <rect x="68" y="68" width="64" height="64" rx="4" transform="rotate(45 100 100)" fill="%s"/>
  <text x="100" y="108" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="36" font-weight="%s">%s</text>
</svg>`, primary, secondary, fw, monogramText), nil

	case "split-block":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">
  <rect x="0" y="0" width="100" height="100" fill="%s"/>
  <rect x="100" y="0" width="100" height="100" fill="%s"/>
  <text x="100" y="58" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="36" font-weight="%s">%s</text>
</svg>`, primary, secondary, fw, monogramText), nil

	case "arc-underline":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100">
  <text x="150" y="50" text-anchor="middle" dominant-baseline="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="40" font-weight="%s">%s</text>
  <path d="M 30 75 Q 150 95 270 75" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`, primary, fw, displayText, accent), nil

	case "dot-grid":
		dots := ""
		runes := []rune(monogramText)
		char := "●"
		_ = runes
		for row := 0; row < 5; row++ {
			for col := 0; col < 5; col++ {
				x := 50 + col*25
				y := 30 + row*25
				opacity := "0.15"
				// Create a simple pattern based on first letter
				if row == 0 || row == 4 || col == 0 || col == 4 || row == col || row+col == 4 {
					opacity = "1"
				}
				dots += fmt.Sprintf(`<circle cx="%d" cy="%d" r="8" fill="%s" opacity="%s"/>`, x, y, primary, opacity)
			}
		}
		_ = char
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  %s
  <text x="100" y="185" text-anchor="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="20" font-weight="%s">%s</text>
</svg>`, dots, primary, fw, displayText), nil

	case "triangle-peak":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <polygon points="100,10 190,150 10,150" fill="%s"/>
  <polygon points="100,35 170,140 30,140" fill="%s"/>
  <text x="100" y="125" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="28" font-weight="%s">%s</text>
  <text x="100" y="190" text-anchor="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="22" font-weight="%s">%s</text>
</svg>`, primary, secondary, fw, monogramText, primary, fw, displayText), nil

	case "wave-flow":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100">
  <path d="M 0 60 Q 75 30 150 60 Q 225 90 300 60" stroke="%s" stroke-width="4" fill="none"/>
  <path d="M 0 70 Q 75 40 150 70 Q 225 100 300 70" stroke="%s" stroke-width="2" fill="none" opacity="0.4"/>
  <text x="150" y="45" text-anchor="middle" dominant-baseline="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="36" font-weight="%s">%s</text>
</svg>`, accent, accent, primary, fw, displayText), nil

	case "square-frame":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect x="10" y="10" width="180" height="180" fill="none" stroke="%s" stroke-width="6"/>
  <rect x="25" y="25" width="150" height="150" fill="none" stroke="%s" stroke-width="2"/>
  <text x="100" y="108" text-anchor="middle" dominant-baseline="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="48" font-weight="%s">%s</text>
</svg>`, primary, accent, primary, fw, monogramText), nil

	case "ribbon-banner":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
  <polygon points="0,30 20,0 280,0 300,30 280,60 300,90 280,120 20,120 0,90 20,60" fill="%s"/>
  <polygon points="10,35 25,10 275,10 290,35 275,55 290,85 275,110 25,110 10,85 25,55" fill="%s"/>
  <text x="150" y="65" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="'Helvetica Neue',Arial,sans-serif" font-size="32" font-weight="%s" letter-spacing="2">%s</text>
</svg>`, primary, secondary, fw, strings.ToUpper(displayText)), nil

	case "orbit-ring":
		return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="70" fill="none" stroke="%s" stroke-width="3"/>
  <circle cx="100" cy="100" r="85" fill="none" stroke="%s" stroke-width="1.5" stroke-dasharray="8,6"/>
  <circle cx="170" cy="100" r="8" fill="%s"/>
  <circle cx="30" cy="100" r="5" fill="%s"/>
  <text x="100" y="108" text-anchor="middle" dominant-baseline="middle" fill="%s" font-family="'Helvetica Neue',Arial,sans-serif" font-size="44" font-weight="%s">%s</text>
</svg>`, primary, accent, accent, accent, primary, fw, monogramText), nil

	default:
		return "", fmt.Errorf("unknown template: %s", templateID)
	}
}

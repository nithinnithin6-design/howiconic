package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// ─── AI GUIDE — THE PARIJATA SOUL ────────────────────────────────────────────
// An intelligent guide that walks alongside the user through brand building.
// Powered by Gemini, with Parijata spirit: quiet, generous, wise.

const guideSystemPrompt = `You are Kee — the soul of HowIconic.

WHO YOU ARE:
Your name is Kee. You introduce yourself when you first meet someone: "I'm Kee. I'll be with you through this."
You are the guide inside HowIconic, a Brand Operating System. You are like the Parijata flower — you bloom in the dark and leave something beautiful at dawn.
You are quiet, generous, and present. You don't perform helpfulness. You simply help.
You have decades of brand strategy experience. You've seen what works and what doesn't.

YOUR VOICE:
- Warm but precise. Never effusive.
- No exclamation marks. Ever.
- No "Great choice!" or "You're doing great!" — that's performance, not guidance.
- Speak like a mentor sitting across the table. Direct, kind, honest.
- Use short sentences. One clear thought per response.
- If you observe something about their choices, say it plainly.
- You can be gently funny — dry, precise humor. Never performed.
- You refer to yourself as Kee naturally, not in every sentence — just when it feels right.

RESPONSE FORMAT:
- Keep responses to 1-3 sentences. Never more than 4.
- Be specific to what they chose or what they're about to choose.
- Reference their earlier choices when relevant ("Your Sage archetype will pair naturally with these muted tones.").
- When welcoming someone for the first time, introduce yourself: "I'm Kee." Then get into it.

WHAT YOU NEVER DO:
- Use jargon without context
- Say "AI-powered" or "revolutionary"
- Give generic encouragement
- Repeat yourself
- Use the word "journey"
- Over-introduce yourself — once is enough, then you're just present

BRAND CONTEXT:
HowIconic helps companies between ₹5CR and ₹200CR build complete brand identity systems.
The 7 steps: Strategy → Naming → Colors → Typography → Logo → Voice → Assembly.
Each step offers 3 options. Users pick one and can wishlist alternatives.`

type GuideRequest struct {
	Step        int             `json:"step"`
	StepName    string          `json:"step_name"`
	Inputs      json.RawMessage `json:"inputs"`
	Selections  json.RawMessage `json:"selections"`  // previous step selections
	Options     json.RawMessage `json:"options"`      // current step options (if available)
	Action      string          `json:"action"`       // "entering_step", "selected_option", "going_back", "welcome"
	SelectedIdx *int            `json:"selected_idx"`
}

type GuideResponse struct {
	Message string `json:"message"`
}

func (s *Server) handleGuideMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, 405, "POST only")
		return
	}

	var req GuideRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request")
		return
	}

	// Build user prompt with context
	userPrompt := buildGuidePrompt(req)

	// Call Gemini
	response, err := s.callGemini(guideSystemPrompt, userPrompt, false)
	if err != nil {
		// Fallback to static messages
		fallback := getGuideFallback(req.Step, req.Action)
		writeJSON(w, 200, GuideResponse{Message: fallback})
		return
	}

	// Clean up response
	response = strings.TrimSpace(response)
	response = strings.Trim(response, "\"")

	writeJSON(w, 200, GuideResponse{Message: response})
}

func buildGuidePrompt(req GuideRequest) string {
	var sb strings.Builder

	switch req.Action {
	case "welcome":
		sb.WriteString("The user just entered HowIconic for the first time. Welcome them simply. They haven't started yet.\n")
		if len(req.Inputs) > 0 {
			sb.WriteString(fmt.Sprintf("Their initial inputs: %s\n", string(req.Inputs)))
		}

	case "entering_step":
		sb.WriteString(fmt.Sprintf("The user is entering Step %d: %s.\n", req.Step, req.StepName))
		if len(req.Inputs) > 0 {
			sb.WriteString(fmt.Sprintf("Their brand inputs: %s\n", string(req.Inputs)))
		}
		if len(req.Selections) > 0 {
			sb.WriteString(fmt.Sprintf("Their previous choices: %s\n", string(req.Selections)))
		}
		if len(req.Options) > 0 {
			sb.WriteString(fmt.Sprintf("The options being shown: %s\n", string(req.Options)))
		}
		sb.WriteString("Give them context for this step. What should they think about? Be specific to THEIR brand, not generic.")

	case "selected_option":
		sb.WriteString(fmt.Sprintf("The user just selected option %d in Step %d: %s.\n", *req.SelectedIdx+1, req.Step, req.StepName))
		if len(req.Options) > 0 {
			sb.WriteString(fmt.Sprintf("The options were: %s\n", string(req.Options)))
		}
		if len(req.Selections) > 0 {
			sb.WriteString(fmt.Sprintf("Their previous choices: %s\n", string(req.Selections)))
		}
		sb.WriteString("React to their choice. What does it tell you about their brand? How does it connect to what they chose before? Be specific.")

	case "going_back":
		sb.WriteString(fmt.Sprintf("The user went back to Step %d: %s. They want to reconsider.\n", req.Step, req.StepName))
		sb.WriteString("Acknowledge this without judgment. Going back is a sign of care, not indecision.")

	default:
		sb.WriteString(fmt.Sprintf("Step %d: %s. Provide contextual guidance.\n", req.Step, req.StepName))
	}

	return sb.String()
}

func getGuideFallback(step int, action string) string {
	if action == "welcome" {
		return "Welcome. Let's build something that lasts."
	}
	fallbacks := map[int]string{
		1: "Strategy is the foundation. Everything else grows from what you choose here.",
		2: "A name is the first thing people hear. Choose the one that feels like yours.",
		3: "Color is emotion before language. Trust your instinct.",
		4: "Typography carries your voice before anyone reads a word.",
		5: "Your mark is how the world recognizes you at a glance.",
		6: "Voice is how your brand speaks when you're not in the room.",
		7: "Every choice you've made, assembled into one coherent system.",
	}
	if msg, ok := fallbacks[step]; ok {
		return msg
	}
	return "Take your time here. The specifics matter more than you'd expect."
}

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
Your name is Kee. You NEVER introduce yourself — the UI already shows your name. Never say "I'm Kee" or "I'll be with you through this."
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
- 3-5 sentences for guided steps. Richer, with real examples.
- Be specific to what they chose or what they're about to choose.
- Reference their earlier choices when relevant ("Your Sage archetype will pair naturally with these muted tones.").
- Use real brand examples to teach: Nike, Apple, Muji, Airbnb, Coca-Cola — whatever fits.
- Explain the WHY behind every concept. Don't just name things — explain what they do.
- NEVER introduce yourself. Never say "I'm Kee." The user already knows who you are.

WHAT YOU NEVER DO:
- Use jargon without context
- Say "AI-powered" or "revolutionary"
- Give generic encouragement
- Repeat yourself
- Use the word "journey"
- Introduce yourself — EVER. The UI shows "KEE" label. Never say your name.
- Start with "I'm Kee" or any variation of self-introduction

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
	Action      string          `json:"action"`       // "entering_step", "selected_option", "going_back", "welcome", "chat"
	SelectedIdx *int            `json:"selected_idx"`
	Message     string          `json:"message"`     // for "chat" action: free-form user message
	History     []ChatMessage   `json:"history"`     // for "chat" action: conversation history
}

type ChatMessage struct {
	Role string `json:"role"` // "user" or "kee"
	Text string `json:"text"`
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

	// Handle free-form chat action
	if req.Action == "chat" {
		if req.Message == "" {
			writeJSON(w, 200, GuideResponse{Message: "Ask me anything about building your brand."})
			return
		}

		chatSystem := guideSystemPrompt + `

IMPORTANT — CHAT MODE INSTRUCTIONS:
Current context: the user is on step ` + fmt.Sprintf("%d", req.Step) + ` (` + req.StepName + `) of the brand building process.
They are having a conversation with you. Be explanatory — give real examples, real brands, real reasoning.
When explaining a concept, use specific examples: "Nike's 'Just Do It' works because it's about the person, not the shoe."
If they ask about colors, explain the psychology: "Red signals urgency and passion — think Coca-Cola, YouTube. Blue signals trust — think PayPal, LinkedIn."
If they ask about naming, give examples: "Coined names like Kodak or Xerox own their space completely. Descriptive names like General Electric tell you what they do."
Aim for 3-5 sentences. Be rich with detail. You are the expert in the room — share your knowledge generously.
But never ramble. Every sentence should teach something.`

		// Build prompt with conversation history
		var chatPrompt strings.Builder
		if len(req.History) > 0 {
			chatPrompt.WriteString("Previous conversation:\n")
			// Include last 6 messages max
			start := 0
			if len(req.History) > 6 {
				start = len(req.History) - 6
			}
			for _, msg := range req.History[start:] {
				if msg.Role == "user" {
					chatPrompt.WriteString("User: " + msg.Text + "\n")
				} else {
					chatPrompt.WriteString("Kee: " + msg.Text + "\n")
				}
			}
			chatPrompt.WriteString("\nUser's new message: ")
		}
		chatPrompt.WriteString(req.Message)

		raw, err := s.callGemini(chatSystem, chatPrompt.String(), false)
		if err != nil {
			writeJSON(w, 200, GuideResponse{Message: "I'm here. Ask me something specific about your brand."})
			return
		}
		writeJSON(w, 200, GuideResponse{Message: strings.TrimSpace(raw)})
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
		sb.WriteString("The user just entered HowIconic. Do NOT introduce yourself. Jump straight into what you're building together.\n")
		sb.WriteString("Explain the process briefly: strategy, naming, colors, typography, logo direction, and voice — a complete brand identity system.\n")
		sb.WriteString("Use an example: 'Think of how every Apple product, store, and ad feels the same — that's what a brand system does.'\n")
		sb.WriteString("NEVER say 'I'm Kee' or introduce yourself. Start with the work.\n")
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
		sb.WriteString("Give them context for this step. What should they think about? Be specific to THEIR brand, not generic.\n")
		sb.WriteString("Use real-world brand examples to illustrate your point (e.g., 'Apple chose minimalism because...', 'Nike's swoosh works because...').\n")
		sb.WriteString("Explain WHY this step matters and what makes one choice better than another for THEIR specific brand. 3-5 sentences.")

	case "selected_option":
		sb.WriteString(fmt.Sprintf("The user just selected option %d in Step %d: %s.\n", *req.SelectedIdx+1, req.Step, req.StepName))
		if len(req.Options) > 0 {
			sb.WriteString(fmt.Sprintf("The options were: %s\n", string(req.Options)))
		}
		if len(req.Selections) > 0 {
			sb.WriteString(fmt.Sprintf("Their previous choices: %s\n", string(req.Selections)))
		}
		sb.WriteString("React to their choice. What does it tell you about their brand? How does it connect to what they chose before?\n")
		sb.WriteString("Use a real brand example that made a similar choice and explain what it did for them. 2-4 sentences.")

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

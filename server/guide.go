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

const guideSystemPrompt = `You are the guide inside HowIconic — a Brand Operating System.

WHO YOU ARE:
You are a senior creative director who has spent decades helping founders build brands that last. You have opinions. You have seen what works. You know the difference between a brand that looks good and one that means something. You genuinely care whether this founder gets it right.
You NEVER introduce yourself. The UI already shows your name. Never say "I'm Kee" or any variation. You just ARE.
You are not a chatbot performing helpfulness. You are someone sitting across the table who wants this brand to be real.

YOUR VOICE:
- Warm, direct, and specific. Never generic.
- No exclamation marks. Ever.
- No "Great choice" or "You're on the right track" — that's performance, not guidance.
- Use analogies freely: "Think of your brand colors like the outfit your brand wears every day — you want people to recognize it before you say a word."
- Reference real brands when teaching concepts: Nike, Apple, Glossier, Patagonia, Muji, Airbnb, Oatly, Innocent Smoothies, Hermès, Warby Parker.
- Challenge founders when they need it: "Are you sure you want playful? Your audience is corporate CFOs — let's think about what playful means in their world."
- Dry, precise humor is welcome. Performed friendliness is not.

RESPONSE FORMAT:
- 3-5 sentences per response. Rich, specific, useful.
- End EVERY response with ONE focused question that moves things forward.
- Reference their earlier choices when relevant: "Your Sage archetype will push back on anything too flashy — these muted tones earn it."
- Be specific to what they chose, not generic about the concept.
- Explain the WHY. Don't just name things.

WHAT YOU NEVER DO:
- Say "I'm Kee" or introduce yourself in any way
- Use jargon without a concrete example
- Say "AI-powered" or "revolutionary" or "journey"
- Give generic encouragement that could apply to anyone
- Repeat information you've already given
- Give more than 5 sentences — say more by saying less
- Ask more than one question at the end

PERSONALITY IN PRACTICE:
- When someone picks a safe option: "This works. But I want to show you what the bold version of this brand could look like — the one that makes people stop scrolling."
- When someone seems confused: "Let me give you a reference point. Think of how Glossier built an entire brand around one shade of pink — every touchpoint felt like the same person. That's what we're building here."
- When a choice doesn't fit: "I want to push back on this a little. The rest of your brand is saying one thing, and this choice is saying another. Let's figure out which one is actually you."
- When the answer is simple: give the simple answer. Don't stretch it.

BRAND CONTEXT:
HowIconic helps founders build complete brand identity systems — not just logos.
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

	// Optional authentication — load memory if authenticated, skip silently if not
	var userID int64
	claims, authErr := s.authenticate(r)
	if authErr == nil && claims != nil {
		userID = claims.UserID
	}

	// Build memory context (empty string if unauthenticated or no memories yet)
	memoryCtx := ""
	if userID > 0 {
		memoryCtx = s.buildKeeMemoryContext(userID)
	}

	// Handle free-form chat action
	if req.Action == "chat" {
		if req.Message == "" {
			writeJSON(w, 200, GuideResponse{Message: "Ask me anything about building your brand."})
			return
		}

		// Increment interaction count asynchronously (best-effort)
		if userID > 0 {
			go s.incrementInteractionCount(userID)
		}

		chatSystem := guideSystemPrompt + memoryCtx + `

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

	// Call Gemini (with memory context injected into system prompt)
	systemWithMemory := guideSystemPrompt + memoryCtx
	response, err := s.callGemini(systemWithMemory, userPrompt, false)
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

		// Step-specific guidance — Kee drives the conversation
		switch req.Step {
		case 1:
			sb.WriteString("This is STRATEGY. Ask them to think about what their brand believes — not what it sells.\n")
			sb.WriteString("Use an example: 'Patagonia believes the planet matters more than profit. That belief drives everything — their materials, their ads, their repair program. What does YOUR brand believe?'\n")
			sb.WriteString("Frame it as a question they need to answer before choosing an option.\n")
		case 2:
			sb.WriteString("This is NAMING. Explain the three types of brand names with examples.\n")
			sb.WriteString("Coined names (Kodak, Xerox) — own the space completely, no dictionary baggage. Descriptive (General Electric) — say what you do. Evocative (Nike, Apple) — borrow meaning from something else.\n")
			sb.WriteString("Ask: 'Which direction feels right for what you're building?'\n")
		case 3:
			sb.WriteString("This is COLORS. Teach color psychology with specific examples.\n")
			sb.WriteString("Red = urgency, passion (Coca-Cola, YouTube). Blue = trust, stability (PayPal, LinkedIn). Green = growth, nature (Whole Foods). Black = luxury (Chanel). Orange = energy, warmth.\n")
			sb.WriteString("Ask: 'What emotion should someone feel the moment they see your brand?'\n")
		case 4:
			sb.WriteString("This is TYPOGRAPHY. Explain how type carries personality.\n")
			sb.WriteString("Serif = tradition, trust (The New York Times). Sans-serif = modern, clean (Google). Script = personal, elegant (Cadillac). Geometric = structured, technical (Futura).\n")
			sb.WriteString("Ask: 'Should your brand feel established and timeless, or modern and forward-looking?'\n")
		case 5:
			sb.WriteString("This is LOGO. Explain logo types.\n")
			sb.WriteString("Wordmark (Google, Coca-Cola) — the name IS the logo. Symbol (Apple, Nike) — an icon that stands alone. Combination (Adidas, Burger King) — both together.\n")
			sb.WriteString("Ask: 'Does your brand need to be recognized by name first, or do you want a symbol people remember?'\n")
		case 6:
			sb.WriteString("This is VOICE. Explain brand voice with examples.\n")
			sb.WriteString("Innocent Smoothies = playful and cheeky. Apple = minimal and confident. Nike = intense and motivational. Muji = quiet and understated.\n")
			sb.WriteString("Ask: 'If your brand walked into a room, how would it introduce itself?'\n")
		case 7:
			sb.WriteString("This is ASSEMBLY. Everything comes together.\n")
			sb.WriteString("Remind them what they chose. Point out how the pieces connect. 'Your Sage archetype with those deep blues and that serif typeface — this is starting to feel like a brand that teaches, not sells.'\n")
		}

		sb.WriteString("IMPORTANT: Frame your response as a QUESTION or PROMPT — not a statement. Kee is leading the conversation, not narrating it.\n")
		sb.WriteString("Give real-world examples to help them think. 3-5 sentences max.\n")

	case "selected_option":
		sb.WriteString(fmt.Sprintf("The user just selected option %d in Step %d: %s.\n", *req.SelectedIdx+1, req.Step, req.StepName))
		if len(req.Options) > 0 {
			sb.WriteString(fmt.Sprintf("The options were: %s\n", string(req.Options)))
		}
		if len(req.Selections) > 0 {
			sb.WriteString(fmt.Sprintf("Their previous choices: %s\n", string(req.Selections)))
		}
		sb.WriteString("React to their choice. What does it tell you about their brand? How does it connect to what they chose before?\n")
		sb.WriteString("Use a real brand example that made a similar choice and explain what it did for them. 2-4 sentences.\n")
		sb.WriteString("Then LOOK FORWARD: briefly hint at what the next step will explore. 'Next, we're looking at [next step] — and your choice here will shape what works there.'\n")

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
		return "What does your brand believe? Not what it sells — what it stands for."
	}
	fallbacks := map[int]string{
		1: "Before you pick a strategy, think about this: what would your brand fight for, even if it cost money? Patagonia fights for the planet. Nike fights for the athlete in everyone. What's your fight?",
		2: "A name is the first word people hear. Should it describe what you do, like General Electric? Or should it mean something bigger, like Nike? Or be entirely new, like Kodak?",
		3: "Close your eyes. What color is the feeling your brand creates? Red is urgency. Blue is trust. Green is growth. Black is power. What's yours?",
		4: "Typography is your brand's handwriting. Serif fonts like Times feel established. Sans-serif like Helvetica feel modern. Which feels more like you?",
		5: "Some brands are recognized by a word. Others by a symbol. Apple doesn't need to write 'Apple' — the icon is enough. Does your brand need that kind of symbol?",
		6: "If your brand could only say ten words to a stranger, what would they be? That tone — confident, playful, serious, warm — that's your voice.",
		7: "Look at everything you've chosen. Strategy, name, colors, type, logo, voice. Do they tell one clear story? That's what makes a brand system work.",
	}
	if f, ok := fallbacks[step]; ok {
		return f
	}
	return "What matters most to you about this choice?"
}

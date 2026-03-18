package server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ─── GUIDED CO-CREATION WIZARD ────────────────────────────────────────────────
// Step-by-step brand building where the user chooses at each stage.
// Steps: 1-Strategy, 2-Naming, 3-Colors, 4-Typography, 5-Logo, 6-Voice, 7-Assembly

const (
	StepStrategy   = 1
	StepNaming     = 2
	StepColors     = 3
	StepTypography = 4
	StepLogo       = 5
	StepVoice      = 6
	StepAssembly   = 7
)

var stepNames = map[int]string{
	StepStrategy:   "strategy",
	StepNaming:     "naming",
	StepColors:     "colors",
	StepTypography: "typography",
	StepLogo:       "logo",
	StepVoice:      "voice",
	StepAssembly:   "assembly",
}

var guideMessages = map[int]string{
	StepStrategy:   "I've studied your inputs carefully. Here are two strategic directions — each will shape everything from your name to your visual language. There's no wrong choice, only different paths.",
	StepNaming:     "Your strategy is locked. Now let's find the name that carries it. These are all coined — they don't exist yet. I've verified .com availability for each. Pick the one that feels right in your mouth when you say it.",
	StepColors:     "Colors are the first thing people feel before they read a word. Based on your energy and strategy, here are palettes that will make your brand unmistakable.",
	StepTypography: "Typography is your brand's handwriting. These pairings each create a different reading experience. Imagine your name set in each.",
	StepLogo:       "Your mark. The thing people will remember before your name. These concepts are built from your strategy DNA — not decoration, but meaning made visible.",
	StepVoice:      "How your brand speaks matters as much as how it looks. Here's a voice system based on everything you've chosen. Edit anything that doesn't sound like you.",
	StepAssembly:   "Every choice you've made — strategy, name, colors, type, mark, voice — assembled into one coherent system. This is YOUR brand. You built it.",
}

// ─── REQUEST/RESPONSE TYPES ───────────────────────────────────────────────────

type GuidedStartRequest struct {
	BrandIdea string `json:"brand_idea"`
	Product   string `json:"product"`
	Audience  string `json:"audience"`
	Vibe      string `json:"vibe"`
}

type GuidedStepRequest struct {
	Step          int             `json:"step"`
	SelectedIndex int             `json:"selected_index"`
	Wishlisted    []int           `json:"wishlisted"`
	Edits         json.RawMessage `json:"edits"`
}

type GuidedBackRequest struct {
	ToStep int `json:"to_step"`
}

type GuidedStepResponse struct {
	BrandID      int64           `json:"brand_id,omitempty"`
	Step         int             `json:"step"`
	StepName     string          `json:"step_name"`
	Options      json.RawMessage `json:"options"`
	GuideMessage string          `json:"guide_message"`
}

type GuidedStateResponse struct {
	BrandID      int64             `json:"brand_id"`
	CurrentStep  int               `json:"current_step"`
	Inputs       GuidedStartRequest `json:"inputs"`
	Steps        []GuidedStepState  `json:"steps"`
}

type GuidedStepState struct {
	StepNumber    int             `json:"step_number"`
	StepName      string          `json:"step_name"`
	Options       json.RawMessage `json:"options"`
	SelectedIndex *int            `json:"selected_index"`
	Wishlisted    []int           `json:"wishlisted"`
	UserEdits     json.RawMessage `json:"user_edits,omitempty"`
	CompletedAt   *string         `json:"completed_at,omitempty"`
}

// ─── HANDLER: POST /api/brands/guided/start ───────────────────────────────────

func (s *Server) handleGuidedStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	var req GuidedStartRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	// Normalize
	vreq := v3BrandRequest{
		BrandIdea: req.BrandIdea,
		Product:   req.Product,
		Audience:  req.Audience,
		Vibe:      req.Vibe,
	}
	vreq.normalize()
	req.BrandIdea = vreq.BrandIdea
	req.Product = vreq.Product
	req.Audience = vreq.Audience
	req.Vibe = vreq.Vibe

	// Create the brand record in guided mode
	uid := generateUID()
	inputsJSON, _ := json.Marshal(req)

	result, err := s.db.Exec(
		`INSERT INTO brands (user_id, name, uid, brand_data, generation_mode, current_step)
		 VALUES (?, ?, ?, ?, 'guided', 1)`,
		claims.UserID, "Untitled Brand", uid, string(inputsJSON),
	)
	if err != nil {
		writeError(w, 500, "Failed to create brand")
		return
	}

	brandID, _ := result.LastInsertId()

	// Generate Step 1: Strategy options
	options, err := s.generateGuidedStep(StepStrategy, req, nil)
	if err != nil {
		// Clean up the brand if generation fails
		s.db.Exec("DELETE FROM brands WHERE id = ?", brandID)
		writeError(w, 502, "Failed to generate strategy options: "+err.Error())
		return
	}

	// Save options for step 1
	optionsJSON, _ := json.Marshal(options)
	_, err = s.db.Exec(
		`INSERT INTO brand_steps (brand_id, step_number, step_name, options_json)
		 VALUES (?, ?, ?, ?)`,
		brandID, StepStrategy, stepNames[StepStrategy], string(optionsJSON),
	)
	if err != nil {
		log.Printf("[guided] Failed to save step 1 for brand %d: %v", brandID, err)
	}

	writeJSON(w, 201, GuidedStepResponse{
		BrandID:      brandID,
		Step:         StepStrategy,
		StepName:     stepNames[StepStrategy],
		Options:      optionsJSON,
		GuideMessage: guideMessages[StepStrategy],
	})
}

// ─── HANDLER: POST /api/brands/:id/guided/step ────────────────────────────────

func (s *Server) handleGuidedStep(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	var numericID int64
	var inputsStr string
	var currentStep int
	err := s.db.QueryRow(
		`SELECT id, brand_data, COALESCE(current_step, 1) FROM brands
		 WHERE (id = ? OR uid = ?) AND user_id = ? AND generation_mode = 'guided'`,
		brandID, brandID, userID,
	).Scan(&numericID, &inputsStr, &currentStep)
	if err != nil {
		writeError(w, 404, "Guided brand not found")
		return
	}

	var req GuidedStepRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	if req.Step != currentStep {
		writeError(w, 400, fmt.Sprintf("Expected step %d, got %d", currentStep, req.Step))
		return
	}
	if req.Step >= StepAssembly {
		writeError(w, 400, "No more steps after assembly")
		return
	}

	// Mark current step as complete
	wishlistJSON, _ := json.Marshal(req.Wishlisted)
	editsJSON := "null"
	if req.Edits != nil {
		editsJSON = string(req.Edits)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = s.db.Exec(
		`UPDATE brand_steps
		 SET selected_index = ?, wishlisted_json = ?, user_edits_json = ?, completed_at = ?
		 WHERE brand_id = ? AND step_number = ?`,
		req.SelectedIndex, string(wishlistJSON), editsJSON, now, numericID, req.Step,
	)
	if err != nil {
		log.Printf("[guided] Failed to update step %d for brand %d: %v", req.Step, numericID, err)
	}

	// Save notable choice to Kee's memory (best-effort, in background)
	go func(uid int64, stepNum int, stepName string, selIdx int) {
		if uid <= 0 {
			return
		}
		notable, _ := s.getKeeMemory(uid, "notable_choices")
		newChoice := fmt.Sprintf("Step %d (%s): chose option %d", stepNum, stepName, selIdx+1)
		if notable != "" {
			notable += "; " + newChoice
		} else {
			notable = newChoice
		}
		s.setKeeMemory(uid, "notable_choices", notable) //nolint
	}(userID, req.Step, stepNames[req.Step], req.SelectedIndex)

	// Parse the brand inputs
	var inputs GuidedStartRequest
	json.Unmarshal([]byte(inputsStr), &inputs)

	// Load all previous completed steps to build context
	context, err := s.loadGuidedContext(numericID)
	if err != nil {
		log.Printf("[guided] Failed to load context for brand %d: %v", numericID, err)
	}

	// Generate next step
	nextStep := req.Step + 1
	options, err := s.generateGuidedStep(nextStep, inputs, context)
	if err != nil {
		writeError(w, 502, fmt.Sprintf("Failed to generate step %d: %s", nextStep, err.Error()))
		return
	}

	// Update current_step on brand
	s.db.Exec("UPDATE brands SET current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", nextStep, numericID)

	// Save options for next step (upsert)
	optionsJSON, _ := json.Marshal(options)
	s.db.Exec("DELETE FROM brand_steps WHERE brand_id = ? AND step_number = ?", numericID, nextStep)
	_, err = s.db.Exec(
		`INSERT INTO brand_steps (brand_id, step_number, step_name, options_json)
		 VALUES (?, ?, ?, ?)`,
		numericID, nextStep, stepNames[nextStep], string(optionsJSON),
	)
	if err != nil {
		log.Printf("[guided] Failed to save step %d for brand %d: %v", nextStep, numericID, err)
	}

	// If this was assembly (step 7), also compose and save the full brand_data
	if nextStep == StepAssembly {
		go s.finalizeGuidedBrand(numericID, inputs, context)
	}

	// Build guide message — interpolate vibe/strategy for color step
	msg := guideMessages[nextStep]
	if nextStep == StepColors {
		strategyPositioning := ""
		if strat, ok := context["strategy"]; ok {
			if sm, ok2 := strat.(map[string]interface{}); ok2 {
				strategyPositioning = safeStr(sm, "positioning")
			}
		}
		if strategyPositioning != "" {
			msg = fmt.Sprintf("Colors are the first thing people feel before they read a word. Based on your %s energy and this strategy — \"%s\" — here are palettes that will make your brand unmistakable.", inputs.Vibe, strategyPositioning)
		} else {
			msg = fmt.Sprintf("Colors are the first thing people feel before they read a word. Based on your %s energy and strategy, here are palettes that will make your brand unmistakable.", inputs.Vibe)
		}
	}

	writeJSON(w, 200, GuidedStepResponse{
		Step:         nextStep,
		StepName:     stepNames[nextStep],
		Options:      optionsJSON,
		GuideMessage: msg,
	})
}

// ─── HANDLER: GET /api/brands/:id/guided/state ────────────────────────────────

func (s *Server) handleGuidedState(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	var numericID int64
	var inputsStr string
	var currentStep int
	err := s.db.QueryRow(
		`SELECT id, brand_data, COALESCE(current_step, 1) FROM brands
		 WHERE (id = ? OR uid = ?) AND user_id = ? AND generation_mode = 'guided'`,
		brandID, brandID, userID,
	).Scan(&numericID, &inputsStr, &currentStep)
	if err != nil {
		writeError(w, 404, "Guided brand not found")
		return
	}

	var inputs GuidedStartRequest
	json.Unmarshal([]byte(inputsStr), &inputs)

	// Load all steps
	rows, err := s.db.Query(
		`SELECT step_number, step_name, options_json,
		        selected_index, COALESCE(wishlisted_json, '[]'),
		        COALESCE(user_edits_json, 'null'), completed_at
		 FROM brand_steps WHERE brand_id = ? ORDER BY step_number ASC`,
		numericID,
	)
	if err != nil {
		writeError(w, 500, "Failed to load steps")
		return
	}
	defer rows.Close()

	steps := []GuidedStepState{}
	for rows.Next() {
		var st GuidedStepState
		var optJSON, wishJSON, editsJSON string
		var selIdx sql.NullInt64
		var completedAt sql.NullString

		if err := rows.Scan(&st.StepNumber, &st.StepName, &optJSON, &selIdx, &wishJSON, &editsJSON, &completedAt); err != nil {
			continue
		}
		st.Options = json.RawMessage(optJSON)
		if selIdx.Valid {
			v := int(selIdx.Int64)
			st.SelectedIndex = &v
		}
		var wish []int
		json.Unmarshal([]byte(wishJSON), &wish)
		st.Wishlisted = wish
		if editsJSON != "null" && editsJSON != "" {
			st.UserEdits = json.RawMessage(editsJSON)
		}
		if completedAt.Valid {
			st.CompletedAt = &completedAt.String
		}
		steps = append(steps, st)
	}

	writeJSON(w, 200, GuidedStateResponse{
		BrandID:     numericID,
		CurrentStep: currentStep,
		Inputs:      inputs,
		Steps:       steps,
	})
}

// ─── HANDLER: POST /api/brands/:id/guided/back ────────────────────────────────

func (s *Server) handleGuidedBack(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}

	var numericID int64
	var currentStep int
	err := s.db.QueryRow(
		`SELECT id, COALESCE(current_step, 1) FROM brands
		 WHERE (id = ? OR uid = ?) AND user_id = ? AND generation_mode = 'guided'`,
		brandID, brandID, userID,
	).Scan(&numericID, &currentStep)
	if err != nil {
		writeError(w, 404, "Guided brand not found")
		return
	}

	var req GuidedBackRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	if req.ToStep < 1 || req.ToStep >= currentStep {
		writeError(w, 400, fmt.Sprintf("to_step must be between 1 and %d", currentStep-1))
		return
	}

	// Clear steps from to_step+1 onwards
	_, err = s.db.Exec(
		"DELETE FROM brand_steps WHERE brand_id = ? AND step_number > ?",
		numericID, req.ToStep,
	)
	if err != nil {
		writeError(w, 500, "Failed to clear steps")
		return
	}

	// Reset selection on the target step (user will re-choose)
	s.db.Exec(
		`UPDATE brand_steps SET selected_index = NULL, wishlisted_json = NULL,
		 user_edits_json = NULL, completed_at = NULL
		 WHERE brand_id = ? AND step_number = ?`,
		numericID, req.ToStep,
	)

	// Update current_step
	s.db.Exec("UPDATE brands SET current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", req.ToStep, numericID)

	// Return the options for the target step
	var optJSON string
	var stepName string
	err = s.db.QueryRow(
		"SELECT options_json, step_name FROM brand_steps WHERE brand_id = ? AND step_number = ?",
		numericID, req.ToStep,
	).Scan(&optJSON, &stepName)
	if err != nil {
		writeError(w, 500, "Failed to load step options")
		return
	}

	writeJSON(w, 200, GuidedStepResponse{
		Step:         req.ToStep,
		StepName:     stepName,
		Options:      json.RawMessage(optJSON),
		GuideMessage: guideMessages[req.ToStep],
	})
}

// ─── CONTEXT LOADER ───────────────────────────────────────────────────────────
// Loads all completed steps and returns a map of step_name → selected option data

func (s *Server) loadGuidedContext(brandID int64) (map[string]interface{}, error) {
	rows, err := s.db.Query(
		`SELECT step_number, step_name, options_json, selected_index
		 FROM brand_steps
		 WHERE brand_id = ? AND completed_at IS NOT NULL
		 ORDER BY step_number ASC`,
		brandID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	context := map[string]interface{}{}
	for rows.Next() {
		var stepNum int
		var stepName, optJSON string
		var selIdx sql.NullInt64

		if err := rows.Scan(&stepNum, &stepName, &optJSON, &selIdx); err != nil {
			continue
		}

		var options []interface{}
		if err := json.Unmarshal([]byte(optJSON), &options); err != nil {
			// Try as single object
			var single interface{}
			if err2 := json.Unmarshal([]byte(optJSON), &single); err2 == nil {
				context[stepName] = single
				continue
			}
			continue
		}

		if selIdx.Valid && int(selIdx.Int64) < len(options) {
			context[stepName] = options[selIdx.Int64]
		} else if len(options) > 0 {
			context[stepName] = options[0]
		}
	}
	return context, nil
}

// ─── STEP GENERATION ─────────────────────────────────────────────────────────
// Dispatches to the right generator based on step number.
// context = map of step_name → selected option from previous steps.

func (s *Server) generateGuidedStep(step int, inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	log.Printf("[guided] Generating step %d (%s) for brand %q", step, stepNames[step], inputs.BrandIdea)

	switch step {
	case StepStrategy:
		return s.generateGuidedStrategy(inputs)
	case StepNaming:
		return s.generateGuidedNaming(inputs, context)
	case StepColors:
		return s.generateGuidedColors(inputs, context)
	case StepTypography:
		return s.generateGuidedTypography(inputs, context)
	case StepLogo:
		return s.generateGuidedLogo(inputs, context)
	case StepVoice:
		return s.generateGuidedVoice(inputs, context)
	case StepAssembly:
		return s.generateGuidedAssembly(inputs, context)
	default:
		return nil, fmt.Errorf("unknown step %d", step)
	}
}

// ─── STEP 1: STRATEGY ─────────────────────────────────────────────────────────

func (s *Server) generateGuidedStrategy(inputs GuidedStartRequest) (interface{}, error) {
	system := `You are a senior brand strategist. Return ONLY valid JSON. No markdown, no explanation outside the JSON.`
	user := fmt.Sprintf(`Generate THREE distinct strategic directions for this brand. Each must be a completely different strategic angle.

Brand idea: %s
Product: %s
Who it's for: %s
Vibe: %s

Return EXACTLY this JSON (array of 3 options):
[
  {
    "positioning": "one sentence: who it's for, what specific gap it fills, why this matters now",
    "values": ["value 1", "value 2", "value 3"],
    "personality": "2-3 adjectives that define the brand's character",
    "archetype": "one word archetype (e.g., Creator, Rebel, Sage, Hero, Outlaw, Explorer)",
    "archetype_why": "one sentence: why this archetype fits this brand specifically",
    "promise": "one sentence: the single most important commitment this brand makes",
    "tensions": ["brand paradox 1 (e.g., Raw and refined)", "brand paradox 2"],
    "whitespace": "one sentence: the market gap this brand uniquely fills"
  },
  {
    "positioning": "a different strategic angle — not just a variation of option 1",
    "values": ["value 1", "value 2", "value 3"],
    "personality": "2-3 adjectives, notably different from option 1",
    "archetype": "different archetype from option 1",
    "archetype_why": "one sentence",
    "promise": "different core promise from option 1",
    "tensions": ["brand paradox 1", "brand paradox 2"],
    "whitespace": "one sentence: different market gap from option 1"
  },
  {
    "positioning": "a third strategic angle — genuinely different from both options above",
    "values": ["value 1", "value 2", "value 3"],
    "personality": "2-3 adjectives, distinct from options 1 and 2",
    "archetype": "different archetype from options 1 and 2",
    "archetype_why": "one sentence",
    "promise": "different core promise from options 1 and 2",
    "tensions": ["brand paradox 1", "brand paradox 2"],
    "whitespace": "one sentence: different market gap from options 1 and 2"
  }
]

Rules:
- The three options must represent genuinely different strategic territories
- Do NOT write paragraphs. Maximum 1 sentence per field.
- Think like a McKinsey partner presenting to a board: maximum clarity, zero filler
- Every answer must be unmistakably about THIS brand, not transferable to any other`, inputs.BrandIdea, inputs.Product, inputs.Audience, inputs.Vibe)

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}
	var result interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("failed to parse strategy JSON: %w", err)
	}
	return result, nil
}

// ─── STEP 2: NAMING ───────────────────────────────────────────────────────────

func (s *Server) generateGuidedNaming(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	strategyJSON, _ := json.Marshal(context["strategy"])

	system := `You are a naming director. Your job is to invent words that did not exist before. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Generate 5 coined, invented brand names based on the approved strategy.

Brand context:
- Idea: %s
- Product: %s
- Audience: %s
- Vibe: %s
- Approved strategy: %s

MANDATORY: Generate COINED, INVENTED words ONLY.
NOT existing dictionary words. NOT Sanskrit/Latin words. NOT common English words.
Create new words by blending syllables from relevant concepts into portmanteaus.

Each name must be:
1) Not existing in any major language
2) Easy to pronounce on first sight
3) 4-9 characters
4) Memorable — sounds like it means something, even though it's invented

Return EXACTLY this JSON (array of 5 name options):
[
  {
    "name": "COINED_WORD",
    "meaning": "what this name evokes — the feeling and associations it creates",
    "origin": "what syllables or concepts were fused, and why it works phonetically",
    "domain_available": true
  },
  ... (5 total)
]

Note: domain_available will be verified after generation.`, inputs.BrandIdea, inputs.Product, inputs.Audience, inputs.Vibe, string(strategyJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}

	var candidates []map[string]interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &candidates); err != nil {
		return nil, fmt.Errorf("failed to parse naming JSON: %w", err)
	}

	// Check domain availability for all candidates
	for i, c := range candidates {
		name := safeStr(c, "name")
		candidates[i]["domain_available"] = checkDomain(name)
		log.Printf("[guided] Domain %s.com available=%v", strings.ToLower(name), candidates[i]["domain_available"])
	}

	return candidates, nil
}

// ─── STEP 3: COLORS ───────────────────────────────────────────────────────────

func (s *Server) generateGuidedColors(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	strategyJSON, _ := json.Marshal(context["strategy"])
	namingJSON, _ := json.Marshal(context["naming"])

	system := `You are a creative director at a Pentagram-calibre studio. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Generate 3 color palette options for this brand.

Brand context:
- Idea: %s
- Vibe: %s
- Approved strategy: %s
- Approved name: %s

Return EXACTLY this JSON (array of 3 palette options):
[
  {
    "palette_name": "evocative name for this palette (e.g., 'Volcanic Precision', 'Arctic Warmth')",
    "mood": "one sentence: the emotional territory this palette occupies",
    "colors": [
      {"creative_name": "evocative color name", "hex": "#XXXXXX", "why": "one sentence grounded in psychology, culture, or competitive positioning"},
      {"creative_name": "evocative color name", "hex": "#XXXXXX", "why": "one sentence"},
      {"creative_name": "evocative color name", "hex": "#XXXXXX", "why": "one sentence"}
    ],
    "canvas": "#0a0a0a",
    "contrast_note": "one sentence about how these colors work on dark backgrounds"
  },
  ... (3 palettes total)
]

Rules for each palette:
- 3 brand colors (non-dark, high-contrast) + canvas (always near-black)
- Colors must work together as a system on dark backgrounds
- For Bold vibe: high contrast, strong primaries. Clean: restrained. Warm: earth tones. Raw: industrial. Future: electric or muted-neon
- Creative names must be evocative — not functional labels like "Primary Blue"
- Each WHY must be specific: reference psychology, culture, category conventions`, inputs.BrandIdea, inputs.Vibe, string(strategyJSON), string(namingJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}
	var result interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("failed to parse colors JSON: %w", err)
	}
	return result, nil
}

// ─── STEP 4: TYPOGRAPHY ───────────────────────────────────────────────────────

func (s *Server) generateGuidedTypography(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	strategyJSON, _ := json.Marshal(context["strategy"])
	namingJSON, _ := json.Marshal(context["naming"])
	colorsJSON, _ := json.Marshal(context["colors"])

	system := `You are a type director. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Suggest 3 typography pairings for this brand.

Brand context:
- Idea: %s
- Vibe: %s
- Strategy: %s
- Name: %s
- Colors: %s

Return EXACTLY this JSON (array of 3 typography pairings):
[
  {
    "pairing_name": "evocative name for this pairing (e.g., 'The Intellectual Rebel', 'Quiet Authority')",
    "headline_font": "Real Google Fonts name",
    "body_font": "Real Google Fonts name (different from headline)",
    "headline_weight": "Black or Bold or SemiBold",
    "body_weight": "Regular or Light",
    "pairing_why": "one sentence: why this pairing creates productive tension and serves this brand",
    "sample_headline": "The brand name set as if on a billboard — show how this font OWNS the space",
    "sample_body": "Two sentences of body copy written in the brand's voice — show the body font in context"
  },
  ... (3 pairings total)
]

Rules:
- Both fonts MUST be real, available Google Fonts
- NOT Playfair Display + Inter (too obvious / overused)
- Think: Space Grotesk, DM Serif Display, Syne, Bricolage Grotesque, Cormorant, Bebas Neue, Cabinet Grotesk, Clash Display
- The pairing must have tension — not two fonts that agree on everything
- Each pairing must feel distinctly different from the others`, inputs.BrandIdea, inputs.Vibe, string(strategyJSON), string(namingJSON), string(colorsJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}
	var result interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("failed to parse typography JSON: %w", err)
	}
	return result, nil
}

// ─── STEP 5: LOGO ─────────────────────────────────────────────────────────────

func (s *Server) generateGuidedLogo(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	// Extract chosen name and primary color
	chosenName := "BRAND"
	primaryHex := "#f17022"
	secondaryHex := "#2a2a2a"

	if naming, ok := context["naming"].(map[string]interface{}); ok {
		if n := safeStr(naming, "name"); n != "" {
			chosenName = n
		}
	}
	if colors, ok := context["colors"].(map[string]interface{}); ok {
		if colorsList, ok2 := colors["colors"].([]interface{}); ok2 && len(colorsList) > 0 {
			if c0, ok3 := colorsList[0].(map[string]interface{}); ok3 {
				if h := safeStr(c0, "hex"); h != "" {
					primaryHex = h
				}
			}
			if len(colorsList) > 1 {
				if c1, ok3 := colorsList[1].(map[string]interface{}); ok3 {
					if h := safeStr(c1, "hex"); h != "" {
						secondaryHex = h
					}
				}
			}
		}
	}

	// Generate logo concepts via AI, then create SVGs
	strategyJSON, _ := json.Marshal(context["strategy"])

	system := `You are a logo concept director. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Generate 3 distinct logo concepts for this brand.

Brand name: %s
Vibe: %s
Strategy: %s

Return EXACTLY this JSON (array of 3 concepts):
[
  {
    "concept_name": "short evocative name for this concept",
    "metaphor": "the central visual metaphor (e.g., 'a compression spring caught mid-release')",
    "construction": "specific geometric description: exact shapes, proportions, relationships, negative space to use",
    "negative_space_idea": "what hidden meaning lives in the negative space, or 'none'",
    "concept_summary": "one sentence a designer can execute from — FedEx-arrow level of clarity",
    "vibe_match": "one sentence on why this concept embodies the brand strategy"
  },
  ... (3 concepts total)
]

Rules:
- Each concept must have a CONCEPT — a visual idea that makes people think
- References: FedEx arrow, Amazon smile, Beats 'b', NBC peacock, WWF panda
- NOT 'use the first letter in a geometric shape' — that's a placeholder, not a concept
- The mark must work as an icon at 32x32 pixels without text
- Each concept must be visually and conceptually different from the others`, chosenName, inputs.Vibe, string(strategyJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}

	var concepts []map[string]interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &concepts); err != nil {
		return nil, fmt.Errorf("failed to parse logo concepts JSON: %w", err)
	}

	// Generate SVG variants for each concept using different vibes to create variety
	vibes := []string{inputs.Vibe, "Clean", "Future"}
	if inputs.Vibe == "Clean" {
		vibes = []string{"Clean", "Bold", "Future"}
	}

	logoOptions := make([]map[string]interface{}, 0, len(concepts))
	for i, concept := range concepts {
		v := vibes[i%len(vibes)]
		svgs := generateVibeLogoSVG(chosenName, primaryHex, secondaryHex, v)
		option := map[string]interface{}{
			"concept_name":        safeStr(concept, "concept_name"),
			"metaphor":            safeStr(concept, "metaphor"),
			"construction":        safeStr(concept, "construction"),
			"negative_space_idea": safeStr(concept, "negative_space_idea"),
			"concept_summary":     safeStr(concept, "concept_summary"),
			"vibe_match":          safeStr(concept, "vibe_match"),
			"symbol_svg":          svgs["symbol_svg"],
			"wordmark_svg":        svgs["wordmark_svg"],
			"combined_svg":        svgs["combined_svg"],
		}
		logoOptions = append(logoOptions, option)
	}

	return logoOptions, nil
}

// ─── STEP 6: VOICE ────────────────────────────────────────────────────────────

func (s *Server) generateGuidedVoice(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	strategyJSON, _ := json.Marshal(context["strategy"])
	namingJSON, _ := json.Marshal(context["naming"])
	colorsJSON, _ := json.Marshal(context["colors"])

	system := `You are a brand voice strategist. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Generate voice & tone guidelines for this brand.

Brand context:
- Idea: %s
- Product: %s
- Audience: %s
- Vibe: %s
- Strategy: %s
- Name chosen: %s
- Colors: %s

Return EXACTLY this JSON (single object — this is the voice system, not options):
[
  {
    "voice_name": "name for this voice archetype (e.g., 'The Direct Visionary', 'The Warm Expert')",
    "tone_description": "2-3 sentences: describe how the brand sounds — not what it says, but HOW it says it",
    "tone_attributes": ["attribute 1 (e.g., Direct)", "attribute 2", "attribute 3", "attribute 4"],
    "sample_copy": {
      "headline": "a short punchy headline written in this voice",
      "product_description": "2-3 sentences describing the product in this voice",
      "social_post": "a social media caption in this voice (under 150 chars)",
      "email_subject": "an email subject line in this voice",
      "tagline": "4-8 word brand tagline"
    },
    "dos": ["Do: specific action tied to this brand's voice", "Do: specific action", "Do: specific action"],
    "donts": ["Never: specific behavior that contradicts this voice", "Never: specific behavior", "Never: specific behavior"]
  }
]

Note: Return as array with 1 item. The user reviews/edits this — not a choice between options.
Rules:
- Sample copy must be written AS the brand speaking — not describing the brand
- Dos/donts must be brand-specific, not generic writing rules
- Tone attributes: short words that nail the personality (e.g., Direct, Warm, Precise, Irreverent)`,
		inputs.BrandIdea, inputs.Product, inputs.Audience, inputs.Vibe,
		string(strategyJSON), string(namingJSON), string(colorsJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}
	var result interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("failed to parse voice JSON: %w", err)
	}
	return result, nil
}

// ─── STEP 7: ASSEMBLY ─────────────────────────────────────────────────────────

func (s *Server) generateGuidedAssembly(inputs GuidedStartRequest, context map[string]interface{}) (interface{}, error) {
	// Build summary of all choices
	summary := map[string]interface{}{
		"inputs":  inputs,
		"context": context,
	}
	summaryJSON, _ := json.Marshal(summary)

	system := `You are a brand author. Write with precision — every sentence earns its place. Return ONLY valid JSON. No markdown.`
	user := fmt.Sprintf(`Assemble the complete brand system from all the user's choices.

All choices made:
%s

Return EXACTLY this JSON:
[
  {
    "brand_name": "the chosen brand name",
    "tagline": "the chosen/refined tagline",
    "story": [
      "sentence 1: the conviction this brand holds — stated with force",
      "sentence 2: the gap or conflict in the world that made this brand necessary",
      "sentence 3: the brand that emerged — name it, claim its space"
    ],
    "brand_promise": "the single most important commitment",
    "positioning_statement": "complete positioning statement: For [audience] who [need], [brand] is the [category] that [differentiator]. Unlike [alternative], [brand] [key distinction].",
    "system_summary": "2-3 sentences: what makes this brand system coherent and distinctive as a whole",
    "next_steps": [
      "Immediate action 1 to bring this brand to life",
      "Immediate action 2",
      "Immediate action 3"
    ]
  }
]`, string(summaryJSON))

	raw, err := s.callGemini(system, user, true)
	if err != nil {
		return nil, err
	}
	var result interface{}
	if err := json.Unmarshal([]byte(cleanGeminiJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("failed to parse assembly JSON: %w", err)
	}

	// Extract brand meta for mockups
	chosenName := "BRAND"
	if naming, ok := context["naming"].(map[string]interface{}); ok {
		if n := safeStr(naming, "name"); n != "" {
			chosenName = n
		}
	}
	assemblyTagline := ""
	if arr, ok := result.([]interface{}); ok && len(arr) > 0 {
		if obj, ok2 := arr[0].(map[string]interface{}); ok2 {
			if t := safeStr(obj, "tagline"); t != "" {
				assemblyTagline = t
			}
		}
	}
	primaryHex := "#f17022"
	secondaryHex := "#2a2a2a"
	if colors, ok := context["colors"].(map[string]interface{}); ok {
		if colorsList, ok2 := colors["colors"].([]interface{}); ok2 && len(colorsList) > 0 {
			if c0, ok3 := colorsList[0].(map[string]interface{}); ok3 {
				if h := safeStr(c0, "hex"); h != "" {
					primaryHex = h
				}
			}
			if len(colorsList) > 1 {
				if c1, ok3 := colorsList[1].(map[string]interface{}); ok3 {
					if h := safeStr(c1, "hex"); h != "" {
						secondaryHex = h
					}
				}
			}
		}
	}
	headlineFont := "Playfair Display"
	bodyFont := "Inter"
	if typography, ok := context["typography"].(map[string]interface{}); ok {
		if h := safeStr(typography, "headline_font"); h != "" {
			headlineFont = h
		}
		if b := safeStr(typography, "body_font"); b != "" {
			bodyFont = b
		}
	}

	// Inject mockups into first assembly option
	if arr, ok := result.([]interface{}); ok && len(arr) > 0 {
		if obj, ok2 := arr[0].(map[string]interface{}); ok2 {
			initial := string([]rune(chosenName)[0:1])
			obj["mockups"] = map[string]string{
				"business_card": generateBusinessCardSVG(chosenName, assemblyTagline, primaryHex, secondaryHex, headlineFont, bodyFont),
				"social_header": generateSocialHeaderSVG(chosenName, assemblyTagline, primaryHex, secondaryHex, headlineFont),
				"app_icon":      generateAppIconSVG(initial, primaryHex),
			}
		}
	}

	return result, nil
}

// ─── FINALIZE GUIDED BRAND ────────────────────────────────────────────────────
// Composes the full brand_data and saves it when assembly is complete.

func (s *Server) finalizeGuidedBrand(brandID int64, inputs GuidedStartRequest, context map[string]interface{}) {
	log.Printf("[guided] Finalizing brand %d", brandID)

	vreq := v3BrandRequest{
		BrandIdea: inputs.BrandIdea,
		Product:   inputs.Product,
		Audience:  inputs.Audience,
		Vibe:      inputs.Vibe,
	}

	// Extract chosen name
	chosenName := "BRAND"
	if naming, ok := context["naming"].(map[string]interface{}); ok {
		if n := safeStr(naming, "name"); n != "" {
			chosenName = n
		}
	}

	// Build naming map
	namingMap := map[string]interface{}{
		"winner":  chosenName,
		"tagline": "",
	}
	if assembly, ok := context["assembly"].(map[string]interface{}); ok {
		namingMap["tagline"] = safeStr(assembly, "tagline")
	}

	// Extract colors
	primaryHex := "#f17022"
	secondaryHex := "#2a2a2a"
	if colors, ok := context["colors"].(map[string]interface{}); ok {
		if colorsList, ok2 := colors["colors"].([]interface{}); ok2 && len(colorsList) > 0 {
			if c0, ok3 := colorsList[0].(map[string]interface{}); ok3 {
				if h := safeStr(c0, "hex"); h != "" {
					primaryHex = h
				}
			}
			if len(colorsList) > 1 {
				if c1, ok3 := colorsList[1].(map[string]interface{}); ok3 {
					if h := safeStr(c1, "hex"); h != "" {
						secondaryHex = h
					}
				}
			}
		}
	}

	// Generate logo SVGs
	logoSVGs := generateVibeLogoSVG(chosenName, primaryHex, secondaryHex, inputs.Vibe)

	// Build strategy and visual maps from context
	strategyMap, _ := context["strategy"].(map[string]interface{})
	if strategyMap == nil {
		strategyMap = map[string]interface{}{}
	}

	// Build visual from colors + typography context
	typographyMap, _ := context["typography"].(map[string]interface{})
	headlineFont := "Space Grotesk"
	bodyFont := "Inter"
	fontPairingWhy := ""
	if typographyMap != nil {
		if h := safeStr(typographyMap, "headline_font"); h != "" {
			headlineFont = h
		}
		if b := safeStr(typographyMap, "body_font"); b != "" {
			bodyFont = b
		}
		fontPairingWhy = safeStr(typographyMap, "pairing_why")
	}

	colorsCtx, _ := context["colors"].(map[string]interface{})
	colorsList := []interface{}{}
	if colorsCtx != nil {
		if cl, ok2 := colorsCtx["colors"].([]interface{}); ok2 {
			colorsList = cl
		}
	}

	visualMap := map[string]interface{}{
		"colors":           colorsList,
		"headline_font":    headlineFont,
		"body_font":        bodyFont,
		"font_pairing_why": fontPairingWhy,
		"logo_concept": map[string]interface{}{
			"concept_summary": "",
			"metaphor":        "",
		},
	}
	if logoCtx, ok := context["logo"].(map[string]interface{}); ok {
		visualMap["logo_concept"] = map[string]interface{}{
			"concept_summary": safeStr(logoCtx, "concept_summary"),
			"metaphor":        safeStr(logoCtx, "metaphor"),
		}
	}

	// Build voice/integration from context
	voiceCtx, _ := context["voice"].(map[string]interface{})
	sampleCopy, _ := voiceCtx["sample_copy"].(map[string]interface{})

	tagline := ""
	if sampleCopy != nil {
		tagline = safeStr(sampleCopy, "tagline")
	}
	if tagline == "" {
		namingMap["tagline"] = tagline
	}

	voiceExamples := []string{}
	if sampleCopy != nil {
		if h := safeStr(sampleCopy, "headline"); h != "" {
			voiceExamples = append(voiceExamples, h)
		}
		if p := safeStr(sampleCopy, "product_description"); p != "" {
			voiceExamples = append(voiceExamples, p)
		}
		if sc := safeStr(sampleCopy, "social_post"); sc != "" {
			voiceExamples = append(voiceExamples, sc)
		}
	}

	dos := []string{}
	donts := []string{}
	if voiceCtx != nil {
		dos = safeStrSlice(voiceCtx, "dos")
		donts = safeStrSlice(voiceCtx, "donts")
	}

	assemblyCtx, _ := context["assembly"].(map[string]interface{})
	story := []string{}
	if assemblyCtx != nil {
		story = safeStrSlice(assemblyCtx, "story")
		if t := safeStr(assemblyCtx, "tagline"); t != "" {
			tagline = t
			namingMap["tagline"] = tagline
		}
	}

	integrationMap := map[string]interface{}{
		"story":          story,
		"voice_examples": voiceExamples,
		"applications":   []string{},
		"dos":            dos,
		"donts":          donts,
	}

	// Update naming map with tagline
	namingMap["tagline"] = tagline
	namingMap["candidates"] = []map[string]interface{}{}

	// Compose the full brand data using v3 composer
	strategyJSON, _ := json.Marshal(strategyMap)
	namingFull := map[string]interface{}{}
	json.Unmarshal(strategyJSON, &namingFull) // start fresh
	namingFull = namingMap

	brandData := composeV3Brand(vreq, strategyMap, namingFull, visualMap, integrationMap, logoSVGs, nil)
	brandData["guided"] = true
	brandData["guided_context"] = context

	// Generate mockup SVGs and store in brand_data
	initial := string([]rune(chosenName)[0:1])
	brandData["mockups"] = map[string]string{
		"business_card": generateBusinessCardSVG(chosenName, tagline, primaryHex, secondaryHex, headlineFont, bodyFont),
		"social_header": generateSocialHeaderSVG(chosenName, tagline, primaryHex, secondaryHex, headlineFont),
		"app_icon":      generateAppIconSVG(initial, primaryHex),
	}

	brandDataJSON, _ := json.Marshal(brandData)
	_, err := s.db.Exec(
		"UPDATE brands SET brand_data = ?, name = ?, current_step = 7, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		string(brandDataJSON), chosenName, brandID,
	)
	if err != nil {
		log.Printf("[guided] Failed to finalize brand %d: %v", brandID, err)
	} else {
		log.Printf("[guided] Brand %d finalized with name %q", brandID, chosenName)
	}

	// Save brand to Kee's memory — look up the owning user
	var ownerID int64
	if err2 := s.db.QueryRow("SELECT user_id FROM brands WHERE id = ?", brandID).Scan(&ownerID); err2 == nil && ownerID > 0 {
		s.setKeeMemory(ownerID, "last_brand", chosenName) //nolint

		// Rebuild full brand names list
		brandRows, err3 := s.db.Query("SELECT name FROM brands WHERE user_id = ? AND name != '' AND name != 'Untitled Brand'", ownerID)
		if err3 == nil {
			defer brandRows.Close()
			var names []string
			for brandRows.Next() {
				var n string
				brandRows.Scan(&n) //nolint
				names = append(names, n)
			}
			if len(names) > 0 {
				summaryBytes, _ := json.Marshal(names)
				s.setKeeMemory(ownerID, "brands_summary", string(summaryBytes)) //nolint
			}
		}
	}
}

// ─── ROUTE DISPATCHER for /api/brands/:id/guided/* ────────────────────────────

func (s *Server) handleGuidedBrand(w http.ResponseWriter, r *http.Request, brandID string, userID int64, subPath string) {
	// subPath is everything after "guided/"
	switch subPath {
	case "step":
		s.handleGuidedStep(w, r, brandID, userID)
	case "state":
		s.handleGuidedState(w, r, brandID, userID)
	case "back":
		s.handleGuidedBack(w, r, brandID, userID)
	default:
		writeError(w, 404, "Unknown guided endpoint: "+subPath)
	}
}

// parseInt64 converts a string to int64
func parseInt64(s string) (int64, error) {
	return strconv.ParseInt(s, 10, 64)
}

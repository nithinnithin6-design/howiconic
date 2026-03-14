package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"
)

// isV3Request peeks at the body to detect if it's a v3 request (has brand_idea field)
func isV3Request(body []byte) bool {
	var probe struct {
		BrandIdea string `json:"brand_idea"`
	}
	json.Unmarshal(body, &probe)
	return probe.BrandIdea != ""
}

// newTicker returns a time.Ticker that fires every n seconds
func newTicker(seconds int) *time.Ticker {
	return time.NewTicker(time.Duration(seconds) * time.Second)
}

const geminiAPIURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

type geminiRequest struct {
	Contents          []geminiContent        `json:"contents"`
	GenerationConfig  map[string]interface{} `json:"generationConfig,omitempty"`
	SystemInstruction *geminiContent         `json:"systemInstruction,omitempty"`
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

	cfg := map[string]interface{}{
		"maxOutputTokens": 16384,
	}
	if jsonMode {
		cfg["responseMimeType"] = "application/json"
	}
	req.GenerationConfig = cfg

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

	// Parse the Gemini response — handle gemini-2.5-flash thinking parts
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text     string `json:"text"`
					Thought  bool   `json:"thought"` // gemini-2.5 thinking part
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return "", fmt.Errorf("empty response from Gemini (no candidates)")
	}

	candidate := geminiResp.Candidates[0]
	if len(candidate.Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini (no content parts). FinishReason: %s", candidate.FinishReason)
	}

	// Collect all non-thought text parts and concatenate them
	// (gemini-2.5-flash may have a thought part followed by the actual response)
	var sb strings.Builder
	for _, part := range candidate.Content.Parts {
		if !part.Thought && part.Text != "" {
			sb.WriteString(part.Text)
		}
	}

	result := sb.String()
	if result == "" {
		// Fallback: use first part regardless of thought flag
		result = candidate.Content.Parts[0].Text
	}

	return result, nil
}

// cleanGeminiJSON strips markdown code fences and fixes common JSON issues
// (trailing commas, etc.) that Gemini sometimes produces.
func cleanGeminiJSON(s string) string {
	s = strings.TrimSpace(s)

	// Strip markdown code fences
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		if idx := strings.LastIndex(s, "```"); idx >= 0 {
			s = s[:idx]
		}
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		if idx := strings.LastIndex(s, "```"); idx >= 0 {
			s = s[:idx]
		}
	}
	s = strings.TrimSpace(s)

	// Remove trailing commas before } or ] — Gemini occasionally generates these
	// Simple regex-free approach: scan character by character
	s = removeTrailingCommas(s)

	return strings.TrimSpace(s)
}

// removeTrailingCommas removes trailing commas before closing braces/brackets
// e.g. {"a": "b",} becomes {"a": "b"}
func removeTrailingCommas(s string) string {
	var buf strings.Builder
	buf.Grow(len(s))
	runes := []rune(s)
	n := len(runes)
	for i := 0; i < n; i++ {
		if runes[i] == ',' {
			// Look ahead skipping whitespace to find if next non-space is } or ]
			j := i + 1
			for j < n && (runes[j] == ' ' || runes[j] == '\t' || runes[j] == '\n' || runes[j] == '\r') {
				j++
			}
			if j < n && (runes[j] == '}' || runes[j] == ']') {
				// Skip this trailing comma
				continue
			}
		}
		buf.WriteRune(runes[i])
	}
	return buf.String()
}

func parseGeminiJSON(raw string) (map[string]interface{}, error) {
	cleaned := cleanGeminiJSON(raw)

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &result); err == nil {
		return result, nil
	}

	// Try json.Decoder which stops at the first valid JSON object
	// (handles "extra content after JSON" case)
	dec := json.NewDecoder(strings.NewReader(cleaned))
	if err := dec.Decode(&result); err == nil {
		return result, nil
	}

	// Fallback: try to find the JSON object boundaries manually
	start := strings.Index(cleaned, "{")
	if start >= 0 {
		// Find the matching closing brace
		depth := 0
		for i := start; i < len(cleaned); i++ {
			switch cleaned[i] {
			case '{':
				depth++
			case '}':
				depth--
				if depth == 0 {
					// Try parsing from start to i+1
					candidate := cleaned[start : i+1]
					var r map[string]interface{}
					if json.Unmarshal([]byte(candidate), &r) == nil {
						return r, nil
					}
					// With trailing comma cleanup
					candidate = removeTrailingCommas(candidate)
					if json.Unmarshal([]byte(candidate), &r) == nil {
						return r, nil
					}
					break
				}
			}
		}
	}

	preview := cleaned
	if len(preview) > 300 {
		preview = preview[:300]
	}
	return nil, fmt.Errorf("JSON parse failed | preview: %s", preview)
}

// Safe extraction helpers

func safeStr(m map[string]interface{}, key string) string {
	if m == nil {
		return ""
	}
	v, ok := m[key]
	if !ok {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprintf("%v", v)
}

func safeStrSlice(m map[string]interface{}, key string) []string {
	if m == nil {
		return nil
	}
	v, ok := m[key]
	if !ok {
		return nil
	}
	if arr, ok := v.([]interface{}); ok {
		result := make([]string, 0, len(arr))
		for _, item := range arr {
			if s, ok := item.(string); ok {
				result = append(result, s)
			}
		}
		return result
	}
	return nil
}

func safeMap(m map[string]interface{}, key string) map[string]interface{} {
	if m == nil {
		return nil
	}
	v, ok := m[key]
	if !ok {
		return nil
	}
	if mm, ok := v.(map[string]interface{}); ok {
		return mm
	}
	return nil
}

func safeMapSlice(m map[string]interface{}, key string) []map[string]interface{} {
	if m == nil {
		return nil
	}
	v, ok := m[key]
	if !ok {
		return nil
	}
	if arr, ok := v.([]interface{}); ok {
		result := make([]map[string]interface{}, 0, len(arr))
		for _, item := range arr {
			if mm, ok := item.(map[string]interface{}); ok {
				result = append(result, mm)
			}
		}
		return result
	}
	return nil
}

func getNestedStr(m map[string]interface{}, keys ...string) string {
	current := m
	for i, key := range keys {
		if i == len(keys)-1 {
			return safeStr(current, key)
		}
		current = safeMap(current, key)
		if current == nil {
			return ""
		}
	}
	return ""
}

func rgbFromColorMap(colorMap map[string]interface{}) string {
	if colorMap == nil {
		return ""
	}
	v, ok := colorMap["rgb"]
	if !ok {
		return ""
	}
	if arr, ok := v.([]interface{}); ok && len(arr) >= 3 {
		toInt := func(x interface{}) int {
			switch n := x.(type) {
			case float64:
				return int(n)
			case int:
				return n
			}
			return 0
		}
		return fmt.Sprintf("%d, %d, %d", toInt(arr[0]), toInt(arr[1]), toInt(arr[2]))
	}
	return ""
}

// V2 pipeline request

type v2BrandRequest struct {
	Essence           string          `json:"essence"`
	ProductVessel     string          `json:"product_vessel"`
	Theme             string          `json:"theme"`
	StyleDirection    string          `json:"style_direction"`
	TargetDescription string          `json:"target_description"`
	Category          string          `json:"category"`
	Geography         string          `json:"geography"`
	// Backward compat
	Prompt  string          `json:"prompt"`
	Context json.RawMessage `json:"context"`
}

func (r *v2BrandRequest) normalize() {
	if r.Essence == "" && r.Prompt != "" {
		r.Essence = r.Prompt
	}
	if r.Essence == "" {
		r.Essence = "a compelling, purposeful brand"
	}
	if r.ProductVessel == "" && r.Context != nil {
		var ctx map[string]interface{}
		if json.Unmarshal(r.Context, &ctx) == nil {
			if v, ok := ctx["vessel"].(string); ok && v != "" {
				r.ProductVessel = v
			}
		}
	}
	if r.ProductVessel == "" {
		r.ProductVessel = "a brand"
	}
	if r.Category == "" {
		r.Category = "consumer brand"
	}
	if r.Geography == "" {
		r.Geography = "India"
	}
	if r.Theme == "" {
		r.Theme = "modern"
	}
	if r.StyleDirection == "" {
		r.StyleDirection = "clean and minimal"
	}
}

// SSE writer

type sseWriter struct {
	w       http.ResponseWriter
	flusher http.Flusher
}

func newSSEWriter(w http.ResponseWriter) (*sseWriter, bool) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, false
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	return &sseWriter{w: w, flusher: flusher}, true
}

func (sw *sseWriter) Send(eventType string, data interface{}) {
	dataJSON, _ := json.Marshal(data)
	fmt.Fprintf(sw.w, "event: %s\ndata: %s\n\n", eventType, dataJSON)
	sw.flusher.Flush()
}

// Ping sends an SSE comment to keep the connection alive through proxies
func (sw *sseWriter) Ping() {
	fmt.Fprintf(sw.w, ": keepalive\n\n")
	sw.flusher.Flush()
}


// ─── STEP 1 PROMPT: BRAND STRATEGY ───────────────────────────────────────────

func buildStep1Prompt(req v2BrandRequest) (system, user string) {
	system = `You are a senior brand strategist at a Pentagram-calibre firm. You have studied 10,000 brand cases and your work has defined category leaders. Your job: find the genuine strategic foundation of a brand, not from templates, but from real insight about the space, the audience, and the gap that exists.

You are NOT filling a template. Every output field must be specific, earned, and non-transferable to any other brand in existence.

MANDATORY AVOID:
- Generic archetypes without deep reasoning
- Vague positioning like "premium quality, accessible price"
- Safe psychographics like "millennials who value authenticity"
- Competitive analysis that lists obvious players without real insight
- Any sentence that could appear in another brand's strategy document

Return ONLY valid JSON. No markdown. No explanation. No wrapper.`

	user = fmt.Sprintf(`Produce a strategic foundation for this brand.

BRAND INPUTS:
- What it believes (essence): %s
- What it sells: %s
- Brand world / theme: %s
- Visual style instinct: %s
- Who it's for: %s
- Competitive category: %s
- Geography: %s

Think hard before writing:
1. What is GENUINELY different about this brand vs every existing player in this category?
2. What is the real reason someone would choose this over what already exists?
3. What is the brand NOT? Anti-positioning matters as much as positioning.
4. Which archetype actually fits after examining ALL alternatives?

Return this exact JSON (all fields required, no placeholder text):
{
  "archetype": "archetype name",
  "archetype_reasoning": "minimum 100 words: why THIS archetype and specifically why NOT the 2-3 obvious alternatives",
  "positioning_statement": "one precise, falsifiable sentence: who it is for, what gap it fills, why that matters",
  "competitive_whitespace": "minimum 120 words: specific named gaps in the actual market this brand can credibly own. Reference real brands.",
  "target_psychographics": {
    "primary": "behavioral description: what they do, believe, and what frustrates them",
    "secondary": "secondary audience behavioral profile",
    "anti_audience": "who this brand will deliberately NOT appeal to and why that exclusion strengthens it"
  },
  "brand_tensions": ["productive tension 1", "productive tension 2", "productive tension 3"],
  "strategic_pillars": [
    {"name": "pillar name", "description": "50-word rationale"},
    {"name": "pillar name", "description": "50-word rationale"},
    {"name": "pillar name", "description": "50-word rationale"}
  ],
  "competitive_landscape": {
    "direct": ["named competitor 1", "named competitor 2", "named competitor 3"],
    "indirect": ["named indirect competitor 1", "named indirect competitor 2"],
    "displacement_opportunity": "which specific segment of which competitor's audience is underserved and how?"
  },
  "brand_promise": "the single most important commitment this brand makes. Not a tagline. A commitment.",
  "cultural_context": "minimum 100 words: what cultural shift or tension makes this brand necessary right now?"
}`,
		req.Essence, req.ProductVessel, req.Theme, req.StyleDirection,
		req.TargetDescription, req.Category, req.Geography)
	return
}

// ─── STEP 2 PROMPT: NAMING & VERBAL IDENTITY ─────────────────────────────────

func buildStep2Prompt(req v2BrandRequest, strategyJSON []byte) (system, user string) {
	system = `You are the naming director at a world-class brand consultancy. You understand that naming is linguistics, psychology, culture, and competitive strategy compressed into one word or phrase.

Great brand name criteria:
- Phonetically satisfying: sounds right, memorable cadence, cross-language performance
- Orthographically clean: easy to spell after hearing once
- Culturally layered: carries meaning across multiple languages or registers
- Competitively open: plausible trademark; domain variation likely available
- Scalable: works for product, company, and cultural movement

MANDATORY AVOID:
- Names ending in -ify, -ly, -io (completely saturated)
- Two generic words combined (QualityFlow, TrueWave)
- Generic virtue words: Pure, True, Real, Smart, Nova, Apex, Prime, Bold
- Names that need explanation to carry meaning
- Names that sound like existing brands in the category

Return ONLY valid JSON. No markdown. No explanation.`

	user = fmt.Sprintf(`Generate naming and verbal identity.

BRAND ESSENCE: %s
PRODUCT/SERVICE: %s
TARGET: %s
STYLE: %s

STRATEGY:
%s

CRITICAL: Generate exactly 3 COINED/INVENTED brand names. NOT existing words. NOT dictionary words. NOT Sanskrit or Latin words. CREATE NEW WORDS by blending syllables, inventing phonetics, creating portmanteaus. Like: Spotify (spot+identify), Kodak (invented), Verizon (veritas+horizon).

Keep ALL text SHORT. No paragraphs. One line per field.

Return this exact JSON:
{
  "name_candidates": [
    {"name": "COINED NAME", "origin": "one line: what syllables/concepts were blended", "brand_fit_score": 85},
    {"name": "COINED NAME", "origin": "one line", "brand_fit_score": 80},
    {"name": "COINED NAME", "origin": "one line", "brand_fit_score": 75}
  ],
  "selected_name": "BEST NAME",
  "tagline": "short punchy tagline",
  "alternative_taglines": ["alt 1", "alt 2"],
  "brand_voice": {
    "tone": "2-4 words",
    "example_sentences": ["sentence 1 in brand voice", "sentence 2", "sentence 3"]
  },
  "naming_story": "2-3 sentences on why this name was chosen"
}`,
		req.Essence, req.ProductVessel, req.TargetDescription, req.StyleDirection,
		string(strategyJSON))
	return
}

// ─── STEP 3 PROMPT: VISUAL DIRECTION ─────────────────────────────────────────

func buildStep3Prompt(strategyJSON, verbalJSON []byte) (system, user string) {
	system = `You are the creative director of a design studio that works exclusively on brand identity. You treat color, typography, and space as strategic decisions, not aesthetic preferences.

FRAMEWORK FOR COLOR DECISIONS:
Every color choice must work on four levels simultaneously:
1. Cultural meaning (varies by geography: India has specific associations for colors)
2. Psychological effect (activation, calm, trust, warmth, authority)
3. Category coding (blue = tech/trust, green = nature/health — use these deliberately or break them deliberately)
4. Temporal positioning (certain palettes read as specific eras)

FRAMEWORK FOR TYPOGRAPHY:
- Grotesque/sans = neutral, modern, system — the brand message carries personality
- Serif = authority, tradition, considered — typeface itself carries weight
- Type pairing creates productive tension: the relationship between typefaces should mirror a brand tension
- Open-source alternatives must be real Google Fonts

WORLD-CLASS REASONING EXAMPLE (study the WHY, not the choice):
AESOP chose brown kraft + pharmacy green. Not because it looks good. Because it references the apothecary tradition of the brand's ingredients, refuses beauty-industry pink, and communicates laboratory over boutique. Every color decision had a reason.

MANDATORY AVOID:
- Blue for trust, green for nature, red for energy (without subversion or justification)
- "Minimal and clean" as a goal in itself — it must mean something specific
- Generic sans + serif pairings with no tension or rationale
- Palettes that could belong to any brand in the category
- Gradients, multi-color compositions without a rule

Return ONLY valid JSON. No markdown. No explanation.`

	user = fmt.Sprintf(`Design the complete visual language for this brand.

STRATEGIC FOUNDATION:
%s

VERBAL IDENTITY (use this to inform ALL visual decisions — the visual system must be the strategic foundation made visible):
%s

Every visual decision must be DERIVED from the strategic and verbal identity. "Because it looks good" is not acceptable reasoning. The WHY is mandatory for every color, every typeface, every spatial decision.

Return this exact JSON:
{
  "color_system": {
    "primary": {
      "name": "give it a real name (e.g., Iron Dusk, not Primary)",
      "hex": "#XXXXXX",
      "rgb": [r, g, b],
      "theory": "60-80 words: psychological, cultural, and competitive reasoning for this specific shade. Why not the default category color?",
      "psychological_effect": "specific effect on the viewer — activation, calm, authority, warmth",
      "usage": "exactly where this color lives in the brand system",
      "why_not_obvious": "why not the default color most brands in this category use?"
    },
    "secondary": {
      "name": "real descriptive name",
      "hex": "#XXXXXX",
      "rgb": [r, g, b],
      "theory": "40-60 words: reasoning for this color and its relationship to the primary",
      "psychological_effect": "specific effect",
      "usage": "specific usage context"
    },
    "tertiary": {
      "name": "real descriptive name",
      "hex": "#XXXXXX",
      "rgb": [r, g, b],
      "theory": "reasoning for this supporting color",
      "usage": "usage context"
    },
    "canvas": "#0A0A0A",
    "color_rule": "the single most important rule for using this color system — what you must NEVER do",
    "color_accessibility": "WCAG compliance note for primary/background combination"
  },
  "typography": {
    "primary_typeface": {
      "family": "specific typeface name",
      "weights_used": ["Bold", "Regular"],
      "rationale": "60-80 words: why this typeface, what personality it brings, what it breaks or affirms",
      "open_source_alternative": "real Google Fonts alternative",
      "usage": "headlines, display text, navigation"
    },
    "secondary_typeface": {
      "family": "specific typeface name",
      "weights_used": ["Regular", "Italic"],
      "rationale": "50-60 words: why this pairing and what tension the two typefaces create",
      "open_source_alternative": "real Google Fonts alternative",
      "usage": "body text, long-form, brand story"
    },
    "type_scale": {
      "display": "72px / 1.1 line-height",
      "headline": "48px / 1.2 line-height",
      "subhead": "24px / 1.4 line-height",
      "body": "16px / 1.6 line-height",
      "caption": "12px / 1.5 line-height"
    },
    "typographic_rules": ["specific rule 1", "specific rule 2", "specific rule 3", "specific rule 4"]
  },
  "spatial_principles": {
    "grid": "grid system description",
    "white_space": "approach to white space and why it matches the brand",
    "visual_density": "low|medium|high — and why this density level matches the brand archetype"
  },
  "texture_and_material": {
    "primary_surface": "main surface quality and what it communicates",
    "accent_texture": "secondary texture if any",
    "what_materials_say": "what the material palette communicates about the brand's values"
  },
  "photography_direction": {
    "style": "overall photographic style and aesthetic",
    "lighting": "specific lighting approach and mood",
    "subject_treatment": "how people and products are shown — relationship to camera, environment",
    "what_to_avoid": "specific photography styles that would contradict the brand"
  },
  "iconography": {
    "style": "icon style description",
    "weight": "stroke weight at standard size",
    "character": "personality of the icon set"
  },
  "visual_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "visual_anti_keywords": ["what to avoid 1", "what to avoid 2", "what to avoid 3"],
  "moodboard_description": "60-80 words: moodboard description referencing real materials, textures, eras, and geographic contexts."
}`,
		string(strategyJSON), string(verbalJSON))
	return
}

// ─── STEP 5 PROMPT: BRAND SYSTEM INTEGRATION ─────────────────────────────────

func buildStep5Prompt(req v2BrandRequest, strategyJSON, verbalJSON, visualJSON []byte) (system, user string) {
	system = `You are the lead author of a Pentagram-level brand identity manual. Your job: write the narrative layer that makes a brand system feel authored, not assembled.

You are synthesizing four layers of work into a coherent, authored document. The brand story you write should make a designer understand not just what the brand looks like, but WHY — why the color was chosen, why the typeface is cold on purpose, why the name sounds like it does.

Write with precision. Every sentence earns its place. No filler, no generic brand-speak. The brand story should read like the founding document of a real company, not a template.`

	user = fmt.Sprintf(`Write the brand system integration for this complete brand.

PRODUCT: %s
ESSENCE: %s

COMPLETE BRAND CONTEXT (synthesize ALL of this):
Strategy Foundation: %s

Verbal Identity: %s

Visual System: %s

Write the integration layer that ties everything together with intentionality and authorship.

Return this exact JSON:
{
  "brand_story": {
    "headline": "one sentence that captures the core conviction — not a tagline, a belief",
    "narrative": "minimum 450 words written in the brand's own voice. Arc: problem the brand sees, the insight it found, the conviction it holds, the brand that emerged. This is the brand SPEAKING, not being described. Use the brand voice defined in Step 2. Make it specific to this brand, this category, this cultural moment. Not generic.",
    "arc": "2 sentences summarizing: problem seen, insight found, conviction held, brand created"
  },
  "system_coherence_notes": "minimum 200 words: explain why each element was chosen and how the parts reinforce each other. Why does the primary color fit the archetype? Why does the typeface pairing create the right tension? Why does the name reflect the positioning? Make the system feel inevitable — as if it could not have been built any other way.",
  "application_scenarios": [
    {
      "context": "Hang Tag",
      "description": "specific, visual description of exactly how the brand appears on this touchpoint",
      "visual_direction": "specific design direction: what goes where, hierarchy, color usage, typography rules"
    },
    {
      "context": "App Loading Screen",
      "description": "visual description",
      "visual_direction": "specific design direction"
    },
    {
      "context": "Instagram Post",
      "description": "visual description",
      "visual_direction": "specific design direction"
    },
    {
      "context": "Physical Store / Pop-Up",
      "description": "visual description",
      "visual_direction": "specific design direction"
    },
    {
      "context": "Business Card",
      "description": "visual description",
      "visual_direction": "specific design direction"
    }
  ],
  "brand_dos": [
    "Specific do with context — not generic",
    "Specific do",
    "Specific do",
    "Specific do",
    "Specific do",
    "Specific do",
    "Specific do",
    "Specific do"
  ],
  "brand_donts": [
    "Specific dont with context — not generic",
    "Specific dont",
    "Specific dont",
    "Specific dont",
    "Specific dont",
    "Specific dont",
    "Specific dont",
    "Specific dont"
  ],
  "evolution_notes": "how this brand grows over 5 years: what becomes more refined, what stays constant, what new expressions become possible",
  "brand_in_culture": "minimum 100 words: where this brand belongs culturally. What shelf does it sit on? What playlist does it play in? What room does it belong to? What other brands share its cultural space without competing with it?"
}`,
		req.ProductVessel, req.Essence,
		string(strategyJSON), string(verbalJSON), string(visualJSON))
	return
}


// ─── BRAND COMPOSITION ────────────────────────────────────────────────────────

// composeFinalBrand maps all step outputs to the BrandSystem format the frontend expects,
// while also embedding the full v2 data for richer display.
func composeFinalBrand(req v2BrandRequest, strategy, verbal, visual, integration map[string]interface{}) map[string]interface{} {
	name := safeStr(verbal, "selected_name")
	if name == "" {
		// Fallback: use first word of product vessel
		words := strings.Fields(req.ProductVessel)
		if len(words) > 0 {
			name = strings.Title(strings.ToLower(words[0]))
		} else {
			name = "UNNAMED"
		}
	}

	// Colors
	colorSystem := safeMap(visual, "color_system")
	primaryColor := safeMap(colorSystem, "primary")
	secondaryColor := safeMap(colorSystem, "secondary")
	tertiaryColor := safeMap(colorSystem, "tertiary")

	primaryHex := safeStr(primaryColor, "hex")
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	secondaryHex := safeStr(secondaryColor, "hex")
	if secondaryHex == "" {
		secondaryHex = "#1a1a1a"
	}
	accentHex := safeStr(tertiaryColor, "hex")
	if accentHex == "" {
		accentHex = "#f5f5f5"
	}
	canvasColor := safeStr(colorSystem, "canvas")
	if canvasColor == "" {
		canvasColor = "#0a0a0a"
	}

	// Typography
	typoSystem := safeMap(visual, "typography")
	primaryTypo := safeMap(typoSystem, "primary_typeface")
	secondaryTypo := safeMap(typoSystem, "secondary_typeface")

	headlineFont := safeStr(primaryTypo, "family")
	if headlineFont == "" {
		headlineFont = safeStr(primaryTypo, "open_source_alternative")
	}
	if headlineFont == "" {
		headlineFont = "Playfair Display"
	}

	bodyFont := safeStr(secondaryTypo, "family")
	if bodyFont == "" {
		bodyFont = safeStr(secondaryTypo, "open_source_alternative")
	}
	if bodyFont == "" {
		bodyFont = "Inter"
	}

	// Brand voice
	brandVoice := safeMap(verbal, "brand_voice")

	// Strategic pillars as string slice
	pillars := safeMapSlice(strategy, "strategic_pillars")
	pillarNames := make([]string, 0, len(pillars))
	for _, p := range pillars {
		if n := safeStr(p, "name"); n != "" {
			pillarNames = append(pillarNames, n)
		}
	}

	// Messaging pillars
	msgPillars := safeMapSlice(verbal, "messaging_pillars")
	msgPillarNames := make([]string, 0, len(msgPillars))
	for _, p := range msgPillars {
		if n := safeStr(p, "pillar"); n != "" {
			msgPillarNames = append(msgPillarNames, n)
		}
	}

	// Brand story
	brandStoryMap := safeMap(integration, "brand_story")
	brandStoryText := safeStr(brandStoryMap, "narrative")
	if brandStoryText == "" {
		brandStoryText = fmt.Sprintf("A brand built on the conviction that %s. Every decision in this identity system flows from this belief.", req.Essence)
	}

	// Applications
	appScenarios := safeMapSlice(integration, "application_scenarios")
	packagingDesc := ""
	websiteDesc := ""
	if len(appScenarios) > 0 {
		packagingDesc = safeStr(appScenarios[0], "description")
	}
	if len(appScenarios) > 1 {
		websiteDesc = safeStr(appScenarios[1], "description")
	}

	// Personality traits from brand voice tone
	toneStr := safeStr(brandVoice, "tone")
	personalityTraits := []string{}
	if toneStr != "" {
		parts := strings.FieldsFunc(toneStr, func(r rune) bool {
			return r == '.' || r == ',' || r == ';'
		})
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" && len(personalityTraits) < 5 {
				personalityTraits = append(personalityTraits, p)
			}
		}
	}
	if len(personalityTraits) == 0 {
		personalityTraits = []string{"Direct", "Authentic", "Purposeful"}
	}

	return map[string]interface{}{
		"name":  name,
		"sense": req.Theme,
		"foundation": map[string]interface{}{
			"purpose":            safeStr(strategy, "brand_promise"),
			"marketWedge":        safeStr(strategy, "competitive_whitespace"),
			"archetype":          safeStr(strategy, "archetype"),
			"customerPsychology": getNestedStr(strategy, "target_psychographics", "primary"),
			"positioning":        safeStr(strategy, "positioning_statement"),
			"designPrinciples":   pillarNames,
			"story":              brandStoryText,
		},
		"voice": map[string]interface{}{
			"tagline":           safeStr(verbal, "tagline"),
			"tone":              toneStr,
			"personalityTraits": personalityTraits,
			"messagingPillars":  msgPillarNames,
			"verbalSignature":   safeStr(brandVoice, "example_copy"),
		},
		"colors": map[string]interface{}{
			"primary": map[string]interface{}{
				"name":            safeStr(primaryColor, "name"),
				"hex":             primaryHex,
				"rgb":             rgbFromColorMap(primaryColor),
				"cmyk":            "",
				"usage":           safeStr(primaryColor, "usage"),
				"emotion":         safeStr(primaryColor, "psychological_effect"),
				"ratio":           60,
				"theory":          safeStr(primaryColor, "theory"),
				"why_not_obvious": safeStr(primaryColor, "why_not_obvious"),
			},
			"secondary": map[string]interface{}{
				"name":    safeStr(secondaryColor, "name"),
				"hex":     secondaryHex,
				"rgb":     rgbFromColorMap(secondaryColor),
				"cmyk":    "",
				"usage":   safeStr(secondaryColor, "usage"),
				"emotion": safeStr(secondaryColor, "psychological_effect"),
				"ratio":   30,
				"theory":  safeStr(secondaryColor, "theory"),
			},
			"accent": map[string]interface{}{
				"name":    safeStr(tertiaryColor, "name"),
				"hex":     accentHex,
				"rgb":     rgbFromColorMap(tertiaryColor),
				"cmyk":    "",
				"usage":   safeStr(tertiaryColor, "usage"),
				"emotion": safeStr(tertiaryColor, "psychological_effect"),
				"ratio":   10,
				"theory":  safeStr(tertiaryColor, "theory"),
			},
			"canvasColor": canvasColor,
		},
		"typography": map[string]interface{}{
			"move": "",
			"hierarchy": map[string]interface{}{
				"headline": map[string]interface{}{
					"fontFamily":    headlineFont,
					"weight":        "Black",
					"size":          "72px",
					"lineHeight":    "1.1",
					"letterSpacing": "-0.04em",
					"usage":         safeStr(primaryTypo, "usage"),
					"rationale":     safeStr(primaryTypo, "rationale"),
				},
				"body": map[string]interface{}{
					"fontFamily":    bodyFont,
					"weight":        "Regular",
					"size":          "16px",
					"lineHeight":    "1.6",
					"letterSpacing": "0",
					"usage":         safeStr(secondaryTypo, "usage"),
					"rationale":     safeStr(secondaryTypo, "rationale"),
				},
				"subheadline": map[string]interface{}{
					"fontFamily":    headlineFont,
					"weight":        "Bold",
					"size":          "24px",
					"lineHeight":    "1.2",
					"letterSpacing": "0",
					"usage":         "",
				},
				"caption": map[string]interface{}{
					"fontFamily":    bodyFont,
					"weight":        "Regular",
					"size":          "12px",
					"lineHeight":    "1.5",
					"letterSpacing": "0.1em",
					"usage":         "",
				},
			},
			"typographicRules":    safeStrSlice(typoSystem, "typographic_rules"),
			"rationale_headline":  safeStr(primaryTypo, "rationale"),
			"rationale_body":      safeStr(secondaryTypo, "rationale"),
		},
		"visualLanguage": map[string]interface{}{
			"shapes":       safeStr(safeMap(visual, "spatial_principles"), "grid"),
			"textureStyle": safeStr(safeMap(visual, "texture_and_material"), "primary_surface"),
			"geometry":     safeStr(safeMap(visual, "iconography"), "style"),
		},
		"applications": map[string]interface{}{
			"packaging": packagingDesc,
			"website":   websiteDesc,
		},
		"logoSystem": func() map[string]interface{} {
			// Map V2 style direction to a vibe for logo generation
			vibe := "Clean"
			style := strings.ToLower(req.StyleDirection + " " + req.Theme)
			switch {
			case strings.Contains(style, "bold") || strings.Contains(style, "strong") || strings.Contains(style, "powerful"):
				vibe = "Bold"
			case strings.Contains(style, "warm") || strings.Contains(style, "organic") || strings.Contains(style, "human"):
				vibe = "Warm"
			case strings.Contains(style, "raw") || strings.Contains(style, "industrial") || strings.Contains(style, "rough"):
				vibe = "Raw"
			case strings.Contains(style, "future") || strings.Contains(style, "tech") || strings.Contains(style, "digital"):
				vibe = "Future"
			}
			logos := generateVibeLogoSVG(name, primaryHex, secondaryHex, vibe)
			return map[string]interface{}{
				"primaryLogoSvg":  logos["combined_svg"],
				"symbolOnlySvg":   logos["symbol_svg"],
				"wordmarkOnlySvg": logos["wordmark_svg"],
				"logic":           safeStr(strategy, "archetype_reasoning"),
				"metaphor":        safeStr(verbal, "naming_story"),
				"kineticLogic":    "",
			}
		}(),
		// V2 extended fields for richer BrandManual display
		"v2Strategy":    strategy,
		"v2Verbal":      verbal,
		"v2Visual":      visual,
		"v2Integration": integration,
	}
}

// ─── PIPELINE RUNNER ──────────────────────────────────────────────────────────

func (s *Server) runV2Pipeline(req v2BrandRequest, sse *sseWriter) (map[string]interface{}, error) {
	emit := func(eventType string, data interface{}) {
		if sse != nil {
			sse.Send(eventType, data)
		}
	}

	// Step 1: Brand Strategy
	emit("step_start", map[string]interface{}{
		"step": 1, "name": "brand_strategy",
		"label": "Crafting brand strategy...", "estimated_seconds": 8,
	})
	sys1, usr1 := buildStep1Prompt(req)
	raw1, err := s.callGemini(sys1, usr1, true)
	if err != nil {
		log.Printf("[v2] Step 1 failed: %v", err)
		return nil, fmt.Errorf("brand strategy step failed: %w", err)
	}
	strategy, err := parseGeminiJSON(raw1)
	if err != nil {
		log.Printf("[v2] Step 1 parse error: %v", err)
		return nil, fmt.Errorf("brand strategy parse failed: %w", err)
	}
	strategyJSON, _ := json.Marshal(strategy)
	emit("step_complete", map[string]interface{}{
		"step": 1, "name": "brand_strategy",
		"preview": map[string]interface{}{
			"archetype":   safeStr(strategy, "archetype"),
			"positioning": safeStr(strategy, "positioning_statement"),
		},
	})

	// Step 2: Naming & Verbal Identity
	emit("step_start", map[string]interface{}{
		"step": 2, "name": "naming_identity",
		"label": "Developing name & voice...", "estimated_seconds": 12,
	})
	sys2, usr2 := buildStep2Prompt(req, strategyJSON)
	raw2, err := s.callGemini(sys2, usr2, true)
	if err != nil {
		log.Printf("[v2] Step 2 failed: %v", err)
		return nil, fmt.Errorf("naming step failed: %w", err)
	}
	verbal, err := parseGeminiJSON(raw2)
	if err != nil {
		log.Printf("[v2] Step 2 parse error: %v", err)
		return nil, fmt.Errorf("naming parse failed: %w", err)
	}
	// Check domain availability for each name candidate
	if candidates, ok := verbal["name_candidates"].([]interface{}); ok {
		for _, c := range candidates {
			if cand, ok := c.(map[string]interface{}); ok {
				name := safeStr(cand, "name")
				if name != "" {
					domain := strings.ToLower(name) + ".com"
					_, err := net.LookupHost(domain)
					cand["domain_available"] = err != nil // no DNS = likely available
					cand["domain"] = domain
				}
			}
		}
	}
	verbalJSON, _ := json.Marshal(verbal)
	emit("step_complete", map[string]interface{}{
		"step": 2, "name": "naming_identity",
		"preview": map[string]interface{}{
			"selected_name": safeStr(verbal, "selected_name"),
			"tagline":       safeStr(verbal, "tagline"),
		},
	})

	// Step 3: Visual Direction
	emit("step_start", map[string]interface{}{
		"step": 3, "name": "visual_direction",
		"label": "Designing visual system...", "estimated_seconds": 14,
	})
	sys3, usr3 := buildStep3Prompt(strategyJSON, verbalJSON)
	raw3, err := s.callGemini(sys3, usr3, true)
	if err != nil {
		log.Printf("[v2] Step 3 failed: %v", err)
		return nil, fmt.Errorf("visual direction step failed: %w", err)
	}
	visual, err := parseGeminiJSON(raw3)
	if err != nil {
		log.Printf("[v2] Step 3 parse error: %v", err)
		return nil, fmt.Errorf("visual parse failed: %w", err)
	}
	visualJSON, _ := json.Marshal(visual)
	colorSys := safeMap(visual, "color_system")
	primaryC := safeMap(colorSys, "primary")
	emit("step_complete", map[string]interface{}{
		"step": 3, "name": "visual_direction",
		"preview": map[string]interface{}{
			"primary_color": safeStr(primaryC, "hex"),
			"primary_name":  safeStr(primaryC, "name"),
			"headline_font": getNestedStr(visual, "typography", "primary_typeface", "family"),
		},
	})

	// Step 5: Brand System Integration
	emit("step_start", map[string]interface{}{
		"step": 5, "name": "system_integration",
		"label": "Integrating brand identity...", "estimated_seconds": 12,
	})
	sys5, usr5 := buildStep5Prompt(req, strategyJSON, verbalJSON, visualJSON)
	raw5, err := s.callGemini(sys5, usr5, true)
	var integration map[string]interface{}
	if err != nil {
		log.Printf("[v2] Step 5 failed (graceful degradation): %v", err)
		integration = map[string]interface{}{
			"brand_story": map[string]interface{}{
				"headline":  fmt.Sprintf("Built on the conviction that %s.", req.Essence),
				"narrative": fmt.Sprintf("A brand built on the conviction that %s. Every decision in this identity system — the name, the color, the typography — flows from this belief.", req.Essence),
			},
			"brand_dos":   []string{"Stay true to the brand's strategic pillars in every touchpoint", "Use the color system as defined", "Let white space breathe"},
			"brand_donts": []string{"Never mix brand colors arbitrarily", "Never use gradients on primary surfaces", "Never compromise the brand voice for short-term trends"},
		}
	} else {
		integration, err = parseGeminiJSON(raw5)
		if err != nil {
			log.Printf("[v2] Step 5 parse error (graceful degradation): %v", err)
			integration = map[string]interface{}{}
		}
	}

	storyHeadline := getNestedStr(integration, "brand_story", "headline")
	if storyHeadline == "" {
		storyHeadline = safeStr(verbal, "selected_name")
	}
	emit("step_complete", map[string]interface{}{
		"step": 5, "name": "system_integration",
		"preview": map[string]interface{}{
			"story_headline": storyHeadline,
		},
	})

	brand := composeFinalBrand(req, strategy, verbal, visual, integration)

	// Step 5b: DALL-E logo rendering (optional — falls back silently if API key missing)
	if s.openaiKey != "" {
		emit("step_start", map[string]interface{}{
			"step": "5b", "name": "logo_render",
			"label": "Rendering logo concepts...", "estimated_seconds": 20,
		})
		// Extract brand info for prompting
		brandName := safeStr(verbal, "selected_name")
		tagline := safeStr(verbal, "tagline")
		colorSys := safeMap(visual, "color_system")
		primaryHex := safeStr(safeMap(colorSys, "primary"), "hex")
		secondaryHex := safeStr(safeMap(colorSys, "secondary"), "hex")
		if primaryHex == "" {
			primaryHex = "#f17022"
		}
		if secondaryHex == "" {
			secondaryHex = "#1a1a1a"
		}
		vibe := "Clean"
		style := strings.ToLower(req.StyleDirection + " " + req.Theme)
		switch {
		case strings.Contains(style, "bold") || strings.Contains(style, "strong"):
			vibe = "Bold"
		case strings.Contains(style, "warm") || strings.Contains(style, "organic"):
			vibe = "Warm"
		case strings.Contains(style, "raw") || strings.Contains(style, "industrial"):
			vibe = "Raw"
		case strings.Contains(style, "future") || strings.Contains(style, "tech"):
			vibe = "Future"
		}
		conceptSummary := safeStr(strategy, "archetype_reasoning")

		dalleLogos, _ := s.generateLogoDallE(brandName, tagline, conceptSummary, primaryHex, secondaryHex, vibe)

		if len(dalleLogos) > 0 {
			if ls, ok := brand["logoSystem"].(map[string]interface{}); ok {
				ls["dalleLogos"] = dalleLogos
			}
		}
		emit("step_complete", map[string]interface{}{
			"step": "5b", "name": "logo_render",
			"preview": map[string]interface{}{
				"logos_generated": len(dalleLogos),
			},
		})
	}

	return brand, nil
}

// ─── HTTP HANDLERS ────────────────────────────────────────────────────────────

// handleGenerateBrand — supports both v2 and v3 pipelines (non-streaming)
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

	body, err := io.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	var brand map[string]interface{}

	if isV3Request(body) {
		// V3 pipeline — 4-field simplified input
		var req v3BrandRequest
		if err := json.Unmarshal(body, &req); err != nil {
			writeError(w, 400, "Invalid request body")
			return
		}
		req.normalize()
		brand, err = s.runV3Pipeline(req, nil)
	} else {
		// V2 pipeline — backward compat
		var req v2BrandRequest
		if err := json.Unmarshal(body, &req); err != nil {
			writeError(w, 400, "Invalid request body")
			return
		}
		req.normalize()
		brand, err = s.runV2Pipeline(req, nil)
	}

	if err != nil {
		writeError(w, 502, err.Error())
		return
	}

	// Increment generation counter
	s.db.Exec("UPDATE users SET generations_count = generations_count + 1 WHERE id = ?", claims.UserID)

	writeJSON(w, 200, map[string]interface{}{"brand": brand})
}

// handleGenerateBrandStream — POST + SSE streaming, supports v2 and v3
func (s *Server) handleGenerateBrandStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		writeError(w, 405, "Method not allowed")
		return
	}
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	body, err := io.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}

	sse, ok := newSSEWriter(w)
	if !ok {
		writeError(w, 500, "Streaming not supported by this server")
		return
	}

	// Keepalive goroutine — pings every 20s to prevent proxy timeout
	done := make(chan struct{})
	go func() {
		ticker := newTicker(20)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				sse.Ping()
			case <-done:
				return
			case <-r.Context().Done():
				return
			}
		}
	}()

	var brand map[string]interface{}

	if isV3Request(body) {
		// V3 pipeline
		var req v3BrandRequest
		if err := json.Unmarshal(body, &req); err != nil {
			close(done)
			sse.Send("error", map[string]interface{}{"message": "Invalid request body"})
			return
		}
		req.normalize()
		brand, err = s.runV3Pipeline(req, sse)
	} else {
		// V2 pipeline
		var req v2BrandRequest
		if err := json.Unmarshal(body, &req); err != nil {
			close(done)
			sse.Send("error", map[string]interface{}{"message": "Invalid request body"})
			return
		}
		req.normalize()
		brand, err = s.runV2Pipeline(req, sse)
	}

	close(done) // Stop keepalive goroutine

	if err != nil {
		sse.Send("error", map[string]interface{}{"message": err.Error()})
		return
	}

	// Increment generation counter
	s.db.Exec("UPDATE users SET generations_count = generations_count + 1 WHERE id = ?", claims.UserID)

	sse.Send("complete", map[string]interface{}{"brand": brand})
}

// handleRefine — POST /api/generate/refine
// Takes the current brand data + user feedback, asks Gemini to refine
func (s *Server) handleRefine(w http.ResponseWriter, r *http.Request) {
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
		BrandID      string          `json:"brand_id"`
		CurrentBrand json.RawMessage `json:"current_brand"`
		Feedback     string          `json:"feedback"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "Invalid request body")
		return
	}
	if req.Feedback == "" {
		writeError(w, 400, "Feedback is required")
		return
	}
	if req.CurrentBrand == nil {
		writeError(w, 400, "current_brand is required")
		return
	}

	// Strip SVG fields from brand to reduce token usage before sending to Gemini
	var brandMap map[string]interface{}
	if err := json.Unmarshal(req.CurrentBrand, &brandMap); err != nil {
		writeError(w, 400, "Invalid brand data")
		return
	}

	// Preserve SVG fields to restore after refinement
	var savedLogoSystem map[string]interface{}
	if ls, ok := brandMap["logoSystem"].(map[string]interface{}); ok {
		savedLogoSystem = map[string]interface{}{
			"primaryLogoSvg":  ls["primaryLogoSvg"],
			"symbolOnlySvg":   ls["symbolOnlySvg"],
			"wordmarkOnlySvg": ls["wordmarkOnlySvg"],
			"logic":           ls["logic"],
			"metaphor":        ls["metaphor"],
			"kineticLogic":    ls["kineticLogic"],
		}
		// Strip SVG data for the prompt (too large)
		ls["primaryLogoSvg"] = "[SVG_PRESERVED]"
		ls["symbolOnlySvg"] = "[SVG_PRESERVED]"
		ls["wordmarkOnlySvg"] = "[SVG_PRESERVED]"
	}

	// Prepare stripped brand JSON for the prompt
	strippedBrand, _ := json.Marshal(brandMap)

	systemPrompt := `You are refining an existing brand identity based on user feedback.
You must return the complete updated brand JSON in the EXACT same format as the input.
Modify ONLY what the user asked for. Keep everything else identical.
Do NOT change the logoSystem field at all — preserve it exactly.
Return ONLY valid JSON. No markdown, no explanation, no code fences.`

	userPrompt := fmt.Sprintf(`CURRENT BRAND SYSTEM:
%s

USER FEEDBACK:
"%s"

Modify ONLY what the user explicitly asked for. Keep everything else identical.
Return the complete updated brand JSON in the same format. Do not change logoSystem.`,
		string(strippedBrand), req.Feedback)

	result, err := s.callGemini(systemPrompt, userPrompt, true)
	if err != nil {
		writeError(w, 502, err.Error())
		return
	}

	// Parse the refined brand
	refinedMap, err := parseGeminiJSON(result)
	if err != nil {
		writeError(w, 502, "Failed to parse refined brand data")
		return
	}

	// Restore SVG fields
	if savedLogoSystem != nil {
		if ls, ok := refinedMap["logoSystem"].(map[string]interface{}); ok {
			ls["primaryLogoSvg"] = savedLogoSystem["primaryLogoSvg"]
			ls["symbolOnlySvg"] = savedLogoSystem["symbolOnlySvg"]
			ls["wordmarkOnlySvg"] = savedLogoSystem["wordmarkOnlySvg"]
			ls["logic"] = savedLogoSystem["logic"]
			ls["metaphor"] = savedLogoSystem["metaphor"]
			ls["kineticLogic"] = savedLogoSystem["kineticLogic"]
		} else {
			refinedMap["logoSystem"] = savedLogoSystem
		}
	}

	writeJSON(w, 200, map[string]interface{}{"brand": refinedMap})
}

// handleGetUserUsage — GET /api/user/usage
func (s *Server) handleGetUserUsage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}
	claims, err := s.authenticate(r)
	if err != nil {
		writeError(w, 401, "Unauthorized")
		return
	}

	var generationsCount int
	var plan string
	err = s.db.QueryRow("SELECT COALESCE(generations_count, 0), COALESCE(plan, 'explorer') FROM users WHERE id = ?", claims.UserID).
		Scan(&generationsCount, &plan)
	if err != nil {
		writeError(w, 500, "Failed to get usage data")
		return
	}

	writeJSON(w, 200, map[string]interface{}{
		"generations_count": generationsCount,
		"plan":              plan,
		"free_limit":        3,
	})
}

// ─── EXISTING HANDLERS (preserved) ───────────────────────────────────────────

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
  "css_preview": "string"
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


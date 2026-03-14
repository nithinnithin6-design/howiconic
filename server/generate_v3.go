package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"strings"
)

// ─── V3 PIPELINE ─────────────────────────────────────────────────────────────
// Designed for design directors. Every output must be ownable.

// v3BrandRequest — simplified 4-field input
type v3BrandRequest struct {
	BrandIdea string `json:"brand_idea"`
	Product   string `json:"product"`
	Audience  string `json:"audience"`
	Vibe      string `json:"vibe"` // Bold | Clean | Warm | Raw | Future
	// Backward compat aliases
	Essence string `json:"essence"`
	Prompt  string `json:"prompt"`
}

func (r *v3BrandRequest) normalize() {
	if r.BrandIdea == "" && r.Essence != "" {
		r.BrandIdea = r.Essence
	}
	if r.BrandIdea == "" && r.Prompt != "" {
		r.BrandIdea = r.Prompt
	}
	if r.BrandIdea == "" {
		r.BrandIdea = "a purposeful brand"
	}
	if r.Product == "" {
		r.Product = "a product"
	}
	if r.Audience == "" {
		r.Audience = "discerning consumers"
	}
	if r.Vibe == "" {
		r.Vibe = "Clean"
	}
}

// checkDomain checks if a .com domain is likely available via DNS lookup.
// Returns true if the domain doesn't resolve (likely available).
func checkDomain(name string) bool {
	domain := strings.ToLower(name) + ".com"
	_, err := net.LookupHost(domain)
	return err != nil // error = no DNS = likely available
}

// ─── V3 STEP 1: STRATEGY (tight — 5 lines) ───────────────────────────────────

func buildV3StrategyPrompt(req v3BrandRequest) (system, user string) {
	system = `You are a senior brand strategist. Return ONLY valid JSON. No markdown, no explanation outside the JSON.`

	user = fmt.Sprintf(`Build the strategic foundation for this brand.

Brand idea: %s
Product: %s
Who it's for: %s
Vibe: %s

Return EXACTLY this JSON:
{
  "archetype": "one word archetype (e.g., Creator, Rebel, Sage, Hero, Outlaw)",
  "archetype_why": "one sentence: why this specific archetype and not the obvious alternatives",
  "positioning": "one sentence: who it's for, what specific gap it fills, why this matters now",
  "audience": "one sentence: behavioral description — what they do, what frustrates them, what they believe",
  "promise": "one sentence: the single most important commitment this brand makes to its audience",
  "tensions": ["short brand paradox phrase (e.g., Raw and refined)", "another productive tension"]
}

Rules:
- Do NOT write paragraphs. Do NOT explain. Maximum 1 sentence per field.
- Tensions are productive brand paradoxes — the brand holds both truths simultaneously
- Think like a McKinsey partner presenting to a board: maximum clarity, zero filler
- Every answer must be unmistakably about THIS brand, not transferable to any other`,
		req.BrandIdea, req.Product, req.Audience, req.Vibe)
	return
}

// ─── V3 STEP 2: NAMING (coined words only) ────────────────────────────────────

func buildV3NamingPrompt(req v3BrandRequest, strategyJSON []byte) (system, user string) {
	system = `You are a naming director. Your job is to invent words that did not exist before. Return ONLY valid JSON. No markdown.`

	user = fmt.Sprintf(`Generate coined, invented brand names.

Brand context:
- Idea: %s
- Product: %s
- Audience: %s
- Vibe: %s
- Strategy: %s

MANDATORY: Generate COINED, INVENTED words ONLY.
NOT existing dictionary words. NOT Sanskrit/Latin words. NOT common English words.
NOT words ending in -ify, -ly, -io. NOT two generic words combined.

Create new words by:
- Blending syllables from relevant concepts into portmanteaus
- Inventing phonetically pleasing combinations that evoke the right feeling
- Compressing two meaningful concepts into one invented word

Great coined name examples:
- Spotify (spot+identify — compressed, energetic)
- Kodak (pure invention for phonetic punch)
- Verizon (veritas+horizon — values fused into a word)
- Häagen-Dazs (completely invented, sounds intentional)
- Xerox (coined for phonetic energy and distinctiveness)

Each name must be:
1) Not existing in any major language
2) Easy to pronounce on first sight
3) 4-9 characters
4) Memorable — sounds like it means something, even though it's invented

Return exactly this JSON:
{
  "candidates": [
    {"name": "COINED_WORD", "origin": "one line: what syllables or concepts were fused, and why it works phonetically"},
    {"name": "COINED_WORD", "origin": "one line"},
    {"name": "COINED_WORD", "origin": "one line"}
  ],
  "winner": "CHOSEN_NAME",
  "winner_reason": "one sentence: why this name beats the others for this specific brand and audience",
  "tagline": "4-8 words that capture the brand's promise or core tension"
}`,
		req.BrandIdea, req.Product, req.Audience, req.Vibe, string(strategyJSON))
	return
}

// ─── V3 STEP 3: VISUAL SYSTEM ─────────────────────────────────────────────────

func buildV3VisualPrompt(req v3BrandRequest, strategyJSON, namingJSON []byte) (system, user string) {
	system = `You are a creative director at a Pentagram-calibre studio. Think like Paula Scher or Michael Bierut. Return ONLY valid JSON. No markdown.`

	user = fmt.Sprintf(`Design the complete visual identity system.

Brand idea: %s
Vibe: %s
Strategy: %s
Naming: %s

Return EXACTLY this JSON:
{
  "colors": [
    {"creative_name": "Evocative color name (NOT Primary/Secondary/Accent)", "hex": "#XXXXXX", "why": "one sentence grounded in psychology, culture, or competitive positioning — not 'feels modern'"},
    {"creative_name": "Name", "hex": "#XXXXXX", "why": "one sentence"},
    {"creative_name": "Name", "hex": "#XXXXXX", "why": "one sentence"},
    {"creative_name": "Deep Void", "hex": "#0a0a0a", "why": "the canvas — what lives in total darkness is what the brand illuminates"}
  ],
  "headline_font": "Real Google Fonts name",
  "body_font": "Real Google Fonts name (different from headline)",
  "font_pairing_why": "one sentence: why this pairing creates productive tension and serves this brand",
  "logo_concept": {
    "metaphor": "the central visual metaphor (e.g., 'a compression spring caught mid-release')",
    "construction": "specific geometric description: exact shapes, proportions, relationships, negative space to use",
    "negative_space_idea": "what hidden meaning lives in the negative space, or 'none' if this mark doesn't use negative space",
    "concept_summary": "one sentence a designer can execute from — FedEx-arrow level of clarity and specificity"
  }
}

Rules for COLORS:
- Generate 3 brand colors + 1 near-black background (#0a0a0a or similar)
- Creative names must be evocative — not functional labels
- Each WHY must be specific: reference psychology, culture, category conventions being broken or honored
- Colors must work together as a system on dark backgrounds
- For Bold vibe: high contrast, strong primaries. Clean: restrained palette. Warm: earth tones. Raw: industrial. Future: electric or muted-neon

Rules for FONTS:
- Both must be real, available Google Fonts
- NOT Playfair Display + Inter (too obvious)
- Think: Space Grotesk, DM Serif Display, Syne, Bricolage Grotesque, Cormorant, Monument Extended equivalents available on Google Fonts
- The pairing must have tension — not two fonts that agree on everything

Rules for LOGO CONCEPT:
- The mark MUST have a CONCEPT — a visual idea that makes people think
- References: FedEx arrow in negative space, Amazon A-to-Z smile, Beats 'b' as headphones silhouette, NBC peacock, WWF panda in negative space
- NOT "use the first letter in a geometric shape" — that's not a concept, that's a placeholder
- The mark must work as an icon at 32x32 pixels without any text
- The concept must be directly related to what the brand believes or sells`,
		req.BrandIdea, req.Vibe, string(strategyJSON), string(namingJSON))
	return
}

// ─── V3 STEP 5: INTEGRATION (tight) ──────────────────────────────────────────

func buildV3IntegrationPrompt(req v3BrandRequest, strategyJSON, namingJSON, visualJSON []byte) (system, user string) {
	system = `You are a brand author. Write with precision — every sentence earns its place. Return ONLY valid JSON. No markdown.`

	user = fmt.Sprintf(`Write the brand integration layer — the authored text that makes the system feel alive.

Brand idea: %s
Product: %s
Vibe: %s
Strategy: %s
Naming: %s
Visual: %s

Return EXACTLY this JSON:
{
  "story": [
    "sentence 1: the conviction this brand holds — stated with force",
    "sentence 2: the gap or conflict in the world that made this brand necessary",
    "sentence 3: the brand that emerged — name it, claim its space"
  ],
  "voice_examples": [
    "Write this AS the brand speaking — not describing the brand. First example.",
    "Another brand voice sentence — different context or product moment.",
    "Third brand voice sentence — shows the range of the tone."
  ],
  "applications": [
    "On [specific touchpoint]: exactly what it looks like — be specific",
    "On [specific touchpoint]: exactly what it looks like",
    "On [specific touchpoint]: exactly what it looks like"
  ],
  "dos": [
    "Do: specific action tied to this brand's identity — not generic",
    "Do: specific action",
    "Do: specific action"
  ],
  "donts": [
    "Never: specific behavior that contradicts this brand — not generic",
    "Never: specific behavior",
    "Never: specific behavior"
  ]
}

Rules:
- Story arc: conviction → gap/conflict → brand emerged. Each sentence must be unmistakably about THIS brand.
- Voice examples: written AS the brand speaking. Show the actual tone. Don't say "we believe in..." — show the belief in action.
- Applications: be specific about the touchpoint (hang tag, Instagram post, packaging sticker, store window, etc.)
- Dos/donts: brand-specific. Not "use consistent fonts" — that's generic. Say what this brand specifically does or never does.`,
		req.BrandIdea, req.Product, req.Vibe,
		string(strategyJSON), string(namingJSON), string(visualJSON))
	return
}

// ─── V3 HELPERS ───────────────────────────────────────────────────────────────

// isDarkColor returns true if the hex color is dark (luminance < 50)
func isDarkColor(hex string) bool {
	h := strings.TrimPrefix(hex, "#")
	if len(h) < 6 {
		return false
	}
	r := hexVal(h[0:2])
	g := hexVal(h[2:4])
	b := hexVal(h[4:6])
	luminance := 0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)
	return luminance < 60
}

func hexVal(s string) int {
	var v int
	fmt.Sscanf(s, "%x", &v)
	return v
}

func hexToRGBString(hex string) string {
	h := strings.TrimPrefix(hex, "#")
	if len(h) < 6 {
		return ""
	}
	r := hexVal(h[0:2])
	g := hexVal(h[2:4])
	b := hexVal(h[4:6])
	return fmt.Sprintf("%d, %d, %d", r, g, b)
}

// generateVibeLogoSVG creates professional geometric SVG marks based on brand vibe.
// Pure Go — never fails, no API calls needed. Each vibe produces a distinct geometric language.
func generateVibeLogoSVG(name, primaryHex, secondaryHex, vibe string) map[string]string {
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	if secondaryHex == "" {
		secondaryHex = "#2a2a2a"
	}
	upperName := strings.ToUpper(name)

	// Use name's first letter to seed variation — so each brand gets a unique mark
	seed := 0
	for _, c := range name {
		seed += int(c)
	}
	nameLen := len(name)

	// Build vibe-specific symbol — varied by brand name so no two are identical
	var symbolCore string
	switch vibe {
	case "Bold":
		// Bold: strong angular forms. Vary by name seed.
		variant := seed % 3
		switch variant {
		case 0:
			// Arrow/chevron pointing up — ascension, ambition
			symbolCore = fmt.Sprintf(`
  <path d="M100,20 L175,100 L140,100 L140,180 L60,180 L60,100 L25,100 Z" fill="%s"/>`, primaryHex)
		case 1:
			// Stacked triangles — strength, layered power
			symbolCore = fmt.Sprintf(`
  <polygon points="100,15 180,135 20,135" fill="none" stroke="%s" stroke-width="5"/>
  <polygon points="100,50 155,135 45,135" fill="%s"/>`, primaryHex, primaryHex)
		default:
			// Bold slash — decisive, cutting through
			w := 24 + (nameLen%3)*4
			symbolCore = fmt.Sprintf(`
  <rect x="60" y="10" width="%d" height="180" rx="4" fill="%s" transform="rotate(-20,100,100)"/>
  <circle cx="100" cy="100" r="12" fill="#0a0a0a"/>`, w, primaryHex)
		}

	case "Warm":
		variant := seed % 3
		switch variant {
		case 0:
			// Overlapping soft circles — connection, community
			symbolCore = fmt.Sprintf(`
  <circle cx="75" cy="90" r="42" fill="%s" opacity="0.8"/>
  <circle cx="125" cy="90" r="42" fill="%s" opacity="0.5"/>
  <circle cx="100" cy="125" r="42" fill="%s" opacity="0.35"/>`, primaryHex, primaryHex, primaryHex)
		case 1:
			// Leaf/petal — organic growth
			symbolCore = fmt.Sprintf(`
  <path d="M100,25 C155,25 175,75 175,100 C175,145 140,175 100,175 C60,175 25,145 25,100 C25,75 45,25 100,25 Z" fill="none" stroke="%s" stroke-width="3.5"/>
  <path d="M100,55 C130,65 145,85 145,100 C145,130 125,150 100,150" fill="none" stroke="%s" stroke-width="2.5" opacity="0.5"/>
  <circle cx="100" cy="100" r="6" fill="%s"/>`, primaryHex, primaryHex, primaryHex)
		default:
			// Rising sun / horizon — warmth, beginning
			symbolCore = fmt.Sprintf(`
  <line x1="20" y1="120" x2="180" y2="120" stroke="%s" stroke-width="3"/>
  <circle cx="100" cy="120" r="50" fill="none" stroke="%s" stroke-width="3"/>
  <path d="M50,120 A50,50 0 0,1 150,120" fill="%s" opacity="0.3"/>`, primaryHex, primaryHex, primaryHex)
		}

	case "Raw":
		variant := seed % 3
		switch variant {
		case 0:
			// Fragmented square — deconstructed, honest
			symbolCore = fmt.Sprintf(`
  <rect x="25" y="25" width="65" height="65" fill="%s"/>
  <rect x="110" y="25" width="65" height="65" fill="%s" opacity="0.6"/>
  <rect x="25" y="110" width="65" height="65" fill="%s" opacity="0.35"/>
  <rect x="110" y="110" width="65" height="65" fill="%s" opacity="0.8"/>`, primaryHex, primaryHex, primaryHex, primaryHex)
		case 1:
			// Cross / plus — raw intersection
			symbolCore = fmt.Sprintf(`
  <rect x="75" y="20" width="50" height="160" fill="%s"/>
  <rect x="20" y="75" width="160" height="50" fill="%s"/>`, primaryHex, primaryHex)
		default:
			// Offset bars — editorial, industrial
			symbolCore = fmt.Sprintf(`
  <rect x="20" y="55" width="120" height="18" fill="%s"/>
  <rect x="60" y="85" width="120" height="18" fill="%s" opacity="0.7"/>
  <rect x="35" y="115" width="130" height="18" fill="%s" opacity="0.45"/>`, primaryHex, primaryHex, primaryHex)
		}

	case "Future":
		variant := seed % 3
		switch variant {
		case 0:
			// Hexagon with node — network, precision
			symbolCore = fmt.Sprintf(`
  <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="%s" stroke-width="2.5"/>
  <circle cx="100" cy="100" r="8" fill="%s"/>
  <line x1="100" y1="20" x2="100" y2="92" stroke="%s" stroke-width="1.5" opacity="0.4"/>
  <line x1="170" y1="140" x2="108" y2="104" stroke="%s" stroke-width="1.5" opacity="0.4"/>
  <line x1="30" y1="140" x2="92" y2="104" stroke="%s" stroke-width="1.5" opacity="0.4"/>`, primaryHex, primaryHex, primaryHex, primaryHex, primaryHex)
		case 1:
			// Orbital rings — tech, motion
			symbolCore = fmt.Sprintf(`
  <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="%s" stroke-width="2" transform="rotate(0,100,100)"/>
  <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="%s" stroke-width="2" transform="rotate(60,100,100)" opacity="0.6"/>
  <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="%s" stroke-width="2" transform="rotate(120,100,100)" opacity="0.35"/>
  <circle cx="100" cy="100" r="6" fill="%s"/>`, primaryHex, primaryHex, primaryHex, primaryHex)
		default:
			// Segmented circle — data, modular
			symbolCore = fmt.Sprintf(`
  <path d="M100,20 A80,80 0 0,1 180,100" fill="none" stroke="%s" stroke-width="3"/>
  <path d="M180,100 A80,80 0 0,1 100,180" fill="none" stroke="%s" stroke-width="3" opacity="0.65"/>
  <path d="M100,180 A80,80 0 0,1 20,100" fill="none" stroke="%s" stroke-width="3" opacity="0.4"/>
  <path d="M20,100 A80,80 0 0,1 100,20" fill="none" stroke="%s" stroke-width="3" opacity="0.2"/>
  <circle cx="100" cy="100" r="10" fill="%s"/>`, primaryHex, primaryHex, primaryHex, primaryHex, primaryHex)
		}

	default: // Clean
		variant := seed % 3
		switch variant {
		case 0:
			// Single circle with gap — openness, clarity
			symbolCore = fmt.Sprintf(`
  <path d="M100,16 A84,84 0 1,1 40,50" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="8" fill="%s"/>`, primaryHex, primaryHex)
		case 1:
			// Square and circle — order meets flow
			symbolCore = fmt.Sprintf(`
  <rect x="30" y="30" width="140" height="140" rx="2" fill="none" stroke="%s" stroke-width="2.5"/>
  <circle cx="100" cy="100" r="45" fill="none" stroke="%s" stroke-width="2.5"/>`, primaryHex, primaryHex)
		default:
			// Dot and line — minimal, definitive
			symbolCore = fmt.Sprintf(`
  <line x1="30" y1="100" x2="160" y2="100" stroke="%s" stroke-width="3" stroke-linecap="round"/>
  <circle cx="170" cy="100" r="10" fill="%s"/>`, primaryHex, primaryHex)
		}
	}

	symbol := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">%s
</svg>`, symbolCore)

	wordmark := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 100">
  <text x="300" y="58" text-anchor="middle" dominant-baseline="middle"
    fill="%s" font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="48" font-weight="800" letter-spacing="12">%s</text>
</svg>`, primaryHex, upperName)

	combined := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200">%s
  <text x="260" y="108" dominant-baseline="middle"
    fill="%s" font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="48" font-weight="800" letter-spacing="10">%s</text>
</svg>`, symbolCore, primaryHex, upperName)

	return map[string]string{
		"symbol_svg":   symbol,
		"wordmark_svg": wordmark,
		"combined_svg": combined,
	}
}

// ─── V3 BRAND COMPOSITION ─────────────────────────────────────────────────────

func composeV3Brand(req v3BrandRequest, strategy, naming, visual, integration map[string]interface{}, logoSVGs map[string]string, dalleLogos []DalleLogo) map[string]interface{} {
	// Name
	winnerName := safeStr(naming, "winner")
	if winnerName == "" {
		winnerName = "UNNAMED"
	}
	tagline := safeStr(naming, "tagline")

	// Colors — find background + brand colors
	colorsList := []map[string]interface{}{}
	if colorsRaw, ok := visual["colors"].([]interface{}); ok {
		for _, c := range colorsRaw {
			if cm, ok := c.(map[string]interface{}); ok {
				colorsList = append(colorsList, cm)
			}
		}
	}

	// Canvas is a sacred design token — always near-black
	// Separate brand colors (non-dark) from background colors (dark)
	bgColor := "#0a0a0a"
	brandColors := []map[string]interface{}{}
	for _, c := range colorsList {
		hex := safeStr(c, "hex")
		if isDarkColor(hex) {
			// Use the darkest generated color as canvas, but cap at #0a0a0a
			bgColor = hex
		} else {
			brandColors = append(brandColors, c)
		}
	}
	// Always enforce sacred canvas token
	bgColor = "#0a0a0a"

	// Defaults
	primaryColor := map[string]interface{}{"creative_name": "Brand Primary", "hex": "#f17022", "why": "Energy and warmth"}
	secondaryColor := map[string]interface{}{"creative_name": "Brand Secondary", "hex": "#2a2a2a", "why": "Depth and grounding"}
	accentColor := map[string]interface{}{"creative_name": "Brand Accent", "hex": "#f5f5f5", "why": "Clarity and contrast"}

	if len(brandColors) > 0 {
		primaryColor = brandColors[0]
	}
	if len(brandColors) > 1 {
		secondaryColor = brandColors[1]
	}
	if len(brandColors) > 2 {
		accentColor = brandColors[2]
	}

	primaryHex := safeStr(primaryColor, "hex")
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	secondaryHex := safeStr(secondaryColor, "hex")
	if secondaryHex == "" {
		secondaryHex = "#2a2a2a"
	}
	accentHex := safeStr(accentColor, "hex")
	if accentHex == "" {
		accentHex = "#f5f5f5"
	}

	// Typography
	headlineFont := safeStr(visual, "headline_font")
	if headlineFont == "" {
		headlineFont = "Playfair Display"
	}
	bodyFont := safeStr(visual, "body_font")
	if bodyFont == "" {
		bodyFont = "Inter"
	}

	// Logo concept
	logoConcept := safeMap(visual, "logo_concept")
	conceptSummary := safeStr(logoConcept, "concept_summary")
	metaphor := safeStr(logoConcept, "metaphor")

	// Logo SVGs
	symbolSVG := logoSVGs["symbol_svg"]
	wordmarkSVG := logoSVGs["wordmark_svg"]
	combinedSVG := logoSVGs["combined_svg"]
	if combinedSVG == "" {
		combinedSVG = symbolSVG
	}

	// Strategy
	archetype := safeStr(strategy, "archetype")
	archetypeWhy := safeStr(strategy, "archetype_why")
	positioning := safeStr(strategy, "positioning")
	audienceDesc := safeStr(strategy, "audience")
	promise := safeStr(strategy, "promise")
	tensions := safeStrSlice(strategy, "tensions")

	// Integration
	storyArr := safeStrSlice(integration, "story")
	storyText := strings.Join(storyArr, " ")
	voiceExamples := safeStrSlice(integration, "voice_examples")
	applications := safeStrSlice(integration, "applications")
	dos := safeStrSlice(integration, "dos")
	donts := safeStrSlice(integration, "donts")

	// Name candidates with domain check
	candidates := safeMapSlice(naming, "candidates")
	v3Candidates := []map[string]interface{}{}
	for _, c := range candidates {
		cname := safeStr(c, "name")
		domainAvailable := checkDomain(cname)
		v3Candidates = append(v3Candidates, map[string]interface{}{
			"name":             cname,
			"origin":           safeStr(c, "origin"),
			"domain_available": domainAvailable,
		})
	}

	// Personality traits
	personalityTraits := []string{archetype}
	if len(tensions) > 0 {
		personalityTraits = append(personalityTraits, tensions...)
	}

	// Applications
	packaging := ""
	website := ""
	if len(applications) > 0 {
		packaging = applications[0]
	}
	if len(applications) > 1 {
		website = applications[1]
	}

	// Generate mockups and social templates
	taglineStr := tagline
	mockups := generateMockups(winnerName, taglineStr, primaryHex, secondaryHex, accentHex)
	socialTemplates := generateSocialTemplates(winnerName, taglineStr, primaryHex, secondaryHex, accentHex)

	return map[string]interface{}{
		"name":  winnerName,
		"sense": req.Vibe,
		"isV3":  true,
		"foundation": map[string]interface{}{
			"purpose":            promise,
			"marketWedge":        positioning,
			"archetype":          archetype,
			"customerPsychology": audienceDesc,
			"positioning":        positioning,
			"designPrinciples":   tensions,
			"story":              storyText,
		},
		"voice": map[string]interface{}{
			"tagline":           tagline,
			"tone":              req.Vibe,
			"personalityTraits": personalityTraits,
			"messagingPillars":  applications,
			"verbalSignature":   strings.Join(voiceExamples, "\n"),
		},
		"colors": map[string]interface{}{
			"primary": map[string]interface{}{
				"name":    safeStr(primaryColor, "creative_name"),
				"hex":     primaryHex,
				"rgb":     hexToRGBString(primaryHex),
				"cmyk":    "",
				"usage":   "Primary brand color",
				"emotion": safeStr(primaryColor, "why"),
				"ratio":   60,
				"theory":  safeStr(primaryColor, "why"),
			},
			"secondary": map[string]interface{}{
				"name":    safeStr(secondaryColor, "creative_name"),
				"hex":     secondaryHex,
				"rgb":     hexToRGBString(secondaryHex),
				"cmyk":    "",
				"usage":   "Secondary brand color",
				"emotion": safeStr(secondaryColor, "why"),
				"ratio":   30,
				"theory":  safeStr(secondaryColor, "why"),
			},
			"accent": map[string]interface{}{
				"name":    safeStr(accentColor, "creative_name"),
				"hex":     accentHex,
				"rgb":     hexToRGBString(accentHex),
				"cmyk":    "",
				"usage":   "Accent color",
				"emotion": safeStr(accentColor, "why"),
				"ratio":   10,
				"theory":  safeStr(accentColor, "why"),
			},
			"canvasColor": bgColor,
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
					"usage":         "Display, brand name, primary headlines",
				},
				"body": map[string]interface{}{
					"fontFamily":    bodyFont,
					"weight":        "Regular",
					"size":          "16px",
					"lineHeight":    "1.6",
					"letterSpacing": "0",
					"usage":         "Body text, long-form content",
				},
				"subheadline": map[string]interface{}{
					"fontFamily":    headlineFont,
					"weight":        "Bold",
					"size":          "24px",
					"lineHeight":    "1.2",
					"letterSpacing": "0",
					"usage":         "Section headers",
				},
				"caption": map[string]interface{}{
					"fontFamily":    bodyFont,
					"weight":        "Regular",
					"size":          "12px",
					"lineHeight":    "1.5",
					"letterSpacing": "0.1em",
					"usage":         "Labels, captions",
				},
			},
			"rationale_headline":  safeStr(visual, "font_pairing_why"),
			"rationale_body":      safeStr(visual, "font_pairing_why"),
		},
		"logoSystem": func() map[string]interface{} {
			ls := map[string]interface{}{
				"primaryLogoSvg":  combinedSVG,
				"symbolOnlySvg":   symbolSVG,
				"wordmarkOnlySvg": wordmarkSVG,
				"logic":           conceptSummary,
				"metaphor":        metaphor,
				"kineticLogic":    "",
			}
			if len(dalleLogos) > 0 {
				ls["dalleLogos"] = dalleLogos
			}
			return ls
		}(),
		"visualLanguage": map[string]interface{}{
			"shapes":       safeStr(logoConcept, "construction"),
			"textureStyle": "",
			"geometry":     safeStr(logoConcept, "negative_space_idea"),
		},
		"applications": map[string]interface{}{
			"packaging": packaging,
			"website":   website,
		},
		// V3-specific fields for rich BrandManual display
		"v3Strategy": map[string]interface{}{
			"archetype":     archetype,
			"archetype_why": archetypeWhy,
			"positioning":   positioning,
			"audience":      audienceDesc,
			"promise":       promise,
			"tensions":      tensions,
		},
		"v3Names": map[string]interface{}{
			"candidates":    v3Candidates,
			"winner":        winnerName,
			"winner_reason": safeStr(naming, "winner_reason"),
		},
		"v3Visual": map[string]interface{}{
			"colors":           colorsList,
			"headline_font":    headlineFont,
			"body_font":        bodyFont,
			"font_pairing_why": safeStr(visual, "font_pairing_why"),
			"logo_concept":     logoConcept,
		},
		"v3Integration": map[string]interface{}{
			"story":          storyArr,
			"voice_examples": voiceExamples,
			"applications":   applications,
			"dos":            dos,
			"donts":          donts,
		},
		"mockups":         mockups,
		"socialTemplates": socialTemplates,
	}
}

// ─── V3 PIPELINE RUNNER ───────────────────────────────────────────────────────

func (s *Server) runV3Pipeline(req v3BrandRequest, sse *sseWriter) (map[string]interface{}, error) {
	emit := func(eventType string, data interface{}) {
		if sse != nil {
			sse.Send(eventType, data)
		}
	}

	// STEP 1: Strategy
	emit("step_start", map[string]interface{}{
		"step": 1, "name": "strategy",
		"label": "Defining strategy...",
	})
	sys1, usr1 := buildV3StrategyPrompt(req)
	raw1, err := s.callGemini(sys1, usr1, true)
	if err != nil {
		return nil, fmt.Errorf("strategy step failed: %w", err)
	}
	strategy, err := parseGeminiJSON(raw1)
	if err != nil {
		return nil, fmt.Errorf("strategy parse failed: %w", err)
	}
	strategyJSON, _ := json.Marshal(strategy)
	emit("step_complete", map[string]interface{}{
		"step": 1, "name": "strategy",
		"preview": map[string]interface{}{
			"archetype":   safeStr(strategy, "archetype"),
			"positioning": safeStr(strategy, "positioning"),
		},
	})

	// STEP 2: Naming
	emit("step_start", map[string]interface{}{
		"step": 2, "name": "naming",
		"label": "Crafting name...",
	})
	sys2, usr2 := buildV3NamingPrompt(req, strategyJSON)
	raw2, err := s.callGemini(sys2, usr2, true)
	if err != nil {
		return nil, fmt.Errorf("naming step failed: %w", err)
	}
	naming, err := parseGeminiJSON(raw2)
	if err != nil {
		return nil, fmt.Errorf("naming parse failed: %w", err)
	}
	namingJSON, _ := json.Marshal(naming)
	emit("step_complete", map[string]interface{}{
		"step": 2, "name": "naming",
		"preview": map[string]interface{}{
			"winner": safeStr(naming, "winner"),
		},
	})

	// Domain availability check (between steps 2 and 3)
	emit("step_start", map[string]interface{}{
		"step": "2b", "name": "domain_check",
		"label": "Checking availability...",
	})
	candidates := safeMapSlice(naming, "candidates")
	winnerName := safeStr(naming, "winner")
	for i, c := range candidates {
		cname := safeStr(c, "name")
		available := checkDomain(cname)
		candidates[i]["domain_available"] = available
		log.Printf("[v3] Domain %s.com available=%v", strings.ToLower(cname), available)
	}
	// Also check winner specifically
	winnerAvailable := checkDomain(winnerName)
	log.Printf("[v3] Winner domain %s.com available=%v", strings.ToLower(winnerName), winnerAvailable)
	emit("step_complete", map[string]interface{}{
		"step": "2b", "name": "domain_check",
		"preview": map[string]interface{}{
			"winner":           winnerName,
			"winner_available": winnerAvailable,
		},
	})

	// STEP 3: Visual system
	emit("step_start", map[string]interface{}{
		"step": 3, "name": "visual",
		"label": "Building visual system...",
	})
	sys3, usr3 := buildV3VisualPrompt(req, strategyJSON, namingJSON)
	raw3, err := s.callGemini(sys3, usr3, true)
	if err != nil {
		return nil, fmt.Errorf("visual step failed: %w", err)
	}
	visual, err := parseGeminiJSON(raw3)
	if err != nil {
		return nil, fmt.Errorf("visual parse failed: %w", err)
	}
	visualJSON, _ := json.Marshal(visual)

	// Extract brand colors (non-dark) for logo generation
	primaryHex := "#f17022"
	secondaryHex := "#1a1a1a"
	if colorsRaw, ok := visual["colors"].([]interface{}); ok {
		brandIdx := 0
		for _, ci := range colorsRaw {
			cm, ok2 := ci.(map[string]interface{})
			if !ok2 {
				continue
			}
			hex := safeStr(cm, "hex")
			if !isDarkColor(hex) { // only use light/colorful colors as brand colors
				if brandIdx == 0 {
					primaryHex = hex
				} else if brandIdx == 1 {
					secondaryHex = hex
				}
				brandIdx++
			}
		}
	}

	logoConcept := safeMap(visual, "logo_concept")
	conceptSummary := safeStr(logoConcept, "concept_summary")

	emit("step_complete", map[string]interface{}{
		"step": 3, "name": "visual",
		"preview": map[string]interface{}{
			"primary_color": primaryHex,
			"headline_font": safeStr(visual, "headline_font"),
			"logo_concept":  conceptSummary,
		},
	})

	// STEP 4: Logo SVG — pure Go geometric generation (no Gemini call, always succeeds)
	emit("step_start", map[string]interface{}{
		"step": 4, "name": "logo",
		"label": "Generating logo mark...",
	})
	log.Printf("[v3] Generating vibe-based logo mark for %q (vibe=%s, primary=%s)", winnerName, req.Vibe, primaryHex)
	logoSVGs := generateVibeLogoSVG(winnerName, primaryHex, secondaryHex, req.Vibe)
	emit("step_complete", map[string]interface{}{
		"step": 4, "name": "logo",
		"preview": map[string]interface{}{
			"symbol_len": len(logoSVGs["symbol_svg"]),
		},
	})

	// STEP 4b: DALL-E logo rendering (optional — falls back silently if API key missing or call fails)
	var dalleLogos []DalleLogo
	if s.openaiKey != "" {
		emit("step_start", map[string]interface{}{
			"step": "4b", "name": "logo_render",
			"label": "Rendering logo concepts...", "estimated_seconds": 20,
		})
		dalleLogos, _ = s.generateLogoDallE(
			winnerName,
			safeStr(naming, "tagline"),
			conceptSummary,
			primaryHex,
			secondaryHex,
			req.Vibe,
		)
		emit("step_complete", map[string]interface{}{
			"step": "4b", "name": "logo_render",
			"preview": map[string]interface{}{
				"logos_generated": len(dalleLogos),
			},
		})
	}

	// STEP 5: Integration
	emit("step_start", map[string]interface{}{
		"step": 5, "name": "integration",
		"label": "Assembling brand...",
	})
	sys5, usr5 := buildV3IntegrationPrompt(req, strategyJSON, namingJSON, visualJSON)
	raw5, err := s.callGemini(sys5, usr5, true)
	var integration map[string]interface{}
	if err != nil {
		log.Printf("[v3] Integration step failed (graceful degradation): %v", err)
		integration = buildV3FallbackIntegration(req, winnerName)
	} else {
		integration, err = parseGeminiJSON(raw5)
		if err != nil {
			log.Printf("[v3] Integration parse error (graceful degradation): %v", err)
			integration = buildV3FallbackIntegration(req, winnerName)
		}
	}
	emit("step_complete", map[string]interface{}{
		"step": 5, "name": "integration",
	})

	return composeV3Brand(req, strategy, naming, visual, integration, logoSVGs, dalleLogos), nil
}

func buildV3FallbackIntegration(req v3BrandRequest, winnerName string) map[string]interface{} {
	return map[string]interface{}{
		"story": []string{
			fmt.Sprintf("This brand holds one conviction: %s.", req.BrandIdea),
			fmt.Sprintf("In a category where %s has become interchangeable, there was space for something that actually means it.", req.Product),
			fmt.Sprintf("%s exists to prove that conviction is a competitive advantage.", winnerName),
		},
		"voice_examples": []string{
			"We don't explain what we do. We show what we believe.",
			"Built without shortcuts. Because shortcuts show.",
			"If you have to ask whether it's right — it isn't.",
		},
		"applications": []string{
			"On the hang tag: the name only — no tagline, no explanation",
			"On Instagram: the product in use, no overlay text",
			"In the store: the mark at human scale, nothing competing with it",
		},
		"dos": []string{
			"Let silence carry the brand — not every surface needs copy",
			"Use the primary color sparingly — make it mean something when it appears",
			"Keep the mark clear of competing elements at all sizes",
		},
		"donts": []string{
			"Never use the logo mark at less than 24px — it loses its geometry",
			"Never mix the brand voice with sales language — they cancel each other",
			"Never use more than two colors in a single execution",
		},
	}
}

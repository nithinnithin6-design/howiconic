package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// handleExportGuide renders a beautiful, printable HTML brand guide
func (s *Server) handleExportGuide(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	// Fetch brand from DB
	var brandName string
	var dataStr string
	err := s.db.QueryRow(
		"SELECT name, brand_data FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		brandID, brandID, userID,
	).Scan(&brandName, &dataStr)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}

	// Parse brand_data
	var brandData map[string]interface{}
	if err := json.Unmarshal([]byte(dataStr), &brandData); err != nil {
		writeError(w, 500, "Failed to parse brand data")
		return
	}

	// Extract guided_context if available, fallback to top-level
	var gc map[string]interface{}
	if gci, ok := brandData["guided_context"]; ok {
		gc, _ = gci.(map[string]interface{})
	}

	// Helper to safely get a string from a map
	gs := func(m map[string]interface{}, key string) string {
		if m == nil {
			return ""
		}
		if v, ok := m[key]; ok {
			return fmt.Sprintf("%v", v)
		}
		return ""
	}

	// Helper to get nested map
	gm := func(m map[string]interface{}, key string) map[string]interface{} {
		if m == nil {
			return nil
		}
		if v, ok := m[key]; ok {
			if r, ok2 := v.(map[string]interface{}); ok2 {
				return r
			}
		}
		return nil
	}

	// Helper to get slice of strings from interface{}
	gsl := func(m map[string]interface{}, key string) []string {
		if m == nil {
			return nil
		}
		v, ok := m[key]
		if !ok {
			return nil
		}
		switch arr := v.(type) {
		case []interface{}:
			out := make([]string, 0, len(arr))
			for _, item := range arr {
				out = append(out, fmt.Sprintf("%v", item))
			}
			return out
		case []string:
			return arr
		}
		return nil
	}

	// ─── Extract data ─────────────────────────────────────────────────────────

	// Strategy
	var strategyData map[string]interface{}
	if gc != nil {
		strategyData = gm(gc, "strategy")
	}
	if strategyData == nil {
		strategyData, _ = brandData["strategy"].(map[string]interface{})
	}

	// Naming
	var namingData map[string]interface{}
	if gc != nil {
		namingData = gm(gc, "naming")
	}
	if namingData == nil {
		namingData, _ = brandData["naming"].(map[string]interface{})
	}

	// Colors
	var colorsData map[string]interface{}
	if gc != nil {
		colorsData = gm(gc, "colors")
	}
	if colorsData == nil {
		if visual, ok := brandData["visual"].(map[string]interface{}); ok {
			// build a minimal colors map from visual
			colorsData = map[string]interface{}{
				"palette_name": "",
				"mood":         "",
				"colors":       visual["colors"],
			}
		}
	}

	// Typography
	var typographyData map[string]interface{}
	if gc != nil {
		typographyData = gm(gc, "typography")
	}
	if typographyData == nil {
		typographyData, _ = brandData["visual"].(map[string]interface{})
	}

	// Logo
	var logoData map[string]interface{}
	if gc != nil {
		logoData = gm(gc, "logo")
	}
	if logoData == nil {
		logoData, _ = brandData["logo"].(map[string]interface{})
	}

	// Voice
	var voiceData map[string]interface{}
	if gc != nil {
		voiceData = gm(gc, "voice")
	}
	if voiceData == nil {
		voiceData, _ = brandData["integration"].(map[string]interface{})
	}

	// Assembly / summary
	var assemblyData map[string]interface{}
	if gc != nil {
		assemblyData = gm(gc, "assembly")
	}

	// ─── Extract specific fields ───────────────────────────────────────────────

	displayName := brandName
	if namingData != nil {
		if n := gs(namingData, "name"); n != "" {
			displayName = n
		} else if n := gs(namingData, "winner"); n != "" {
			displayName = n
		}
	}

	tagline := ""
	if namingData != nil {
		tagline = gs(namingData, "tagline")
	}
	if tagline == "" && assemblyData != nil {
		tagline = gs(assemblyData, "tagline")
	}

	// Colors list
	colorsList := []map[string]interface{}{}
	if colorsData != nil {
		if cl, ok := colorsData["colors"].([]interface{}); ok {
			for _, c := range cl {
				if cm, ok2 := c.(map[string]interface{}); ok2 {
					colorsList = append(colorsList, cm)
				}
			}
		}
	}

	primaryHex := "#f17022"
	secondaryHex := "#2a2a2a"
	if len(colorsList) > 0 {
		if h := gs(colorsList[0], "hex"); h != "" {
			primaryHex = h
		}
	}
	if len(colorsList) > 1 {
		if h := gs(colorsList[1], "hex"); h != "" {
			secondaryHex = h
		}
	}

	headlineFont := "Playfair Display"
	bodyFont := "Inter"
	if typographyData != nil {
		if h := gs(typographyData, "headline_font"); h != "" {
			headlineFont = h
		}
		if b := gs(typographyData, "body_font"); b != "" {
			bodyFont = b
		}
	}

	// Sample headline / body
	sampleHeadline := displayName
	sampleBody := "Crafted with intention. Built for the future."
	if typographyData != nil {
		if sh := gs(typographyData, "sample_headline"); sh != "" {
			sampleHeadline = sh
		}
		if sb := gs(typographyData, "sample_body"); sb != "" {
			sampleBody = sb
		}
	}

	// SVGs
	combinedSVG := ""
	wordmarkSVG := ""
	symbolSVG := ""
	if logoData != nil {
		combinedSVG = gs(logoData, "combined_svg")
		wordmarkSVG = gs(logoData, "wordmark_svg")
		symbolSVG = gs(logoData, "symbol_svg")
	}

	// Voice
	voiceName := ""
	toneDescription := ""
	toneAttributes := []string{}
	sampleCopyHeadline := ""
	sampleCopyProduct := ""
	sampleCopySocial := ""
	sampleCopyTagline := tagline
	dos := []string{}
	donts := []string{}

	if voiceData != nil {
		voiceName = gs(voiceData, "voice_name")
		toneDescription = gs(voiceData, "tone_description")
		toneAttributes = gsl(voiceData, "tone_attributes")
		dos = gsl(voiceData, "dos")
		donts = gsl(voiceData, "donts")
		if sc := gm(voiceData, "sample_copy"); sc != nil {
			sampleCopyHeadline = gs(sc, "headline")
			sampleCopyProduct = gs(sc, "product_description")
			sampleCopySocial = gs(sc, "social_post")
			if t := gs(sc, "tagline"); t != "" {
				sampleCopyTagline = t
			}
		}
		// fallback for classic brands (integration map)
		if voiceName == "" {
			if ve := gsl(voiceData, "voice_examples"); len(ve) > 0 {
				sampleCopyHeadline = ve[0]
				if len(ve) > 1 {
					sampleCopyProduct = ve[1]
				}
			}
		}
	}

	// Strategy fields
	archetype := ""
	positioning := ""
	promise := ""
	values := []string{}
	tensions := []string{}
	if strategyData != nil {
		archetype = gs(strategyData, "archetype")
		positioning = gs(strategyData, "positioning")
		promise = gs(strategyData, "promise")
		values = gsl(strategyData, "values")
		tensions = gsl(strategyData, "tensions")
	}

	// Naming fields
	nameMeaning := ""
	nameOrigin := ""
	domainAvailable := ""
	if namingData != nil {
		nameMeaning = gs(namingData, "meaning")
		nameOrigin = gs(namingData, "origin")
		domainAvailable = gs(namingData, "domain_available")
	}

	// Assembly fields
	positioningStatement := ""
	brandPromise := ""
	story := []string{}
	nextSteps := []string{}
	systemSummary := ""
	if assemblyData != nil {
		positioningStatement = gs(assemblyData, "positioning_statement")
		brandPromise = gs(assemblyData, "brand_promise")
		story = gsl(assemblyData, "story")
		nextSteps = gsl(assemblyData, "next_steps")
		systemSummary = gs(assemblyData, "system_summary")
	}
	if brandPromise == "" && strategyData != nil {
		brandPromise = gs(strategyData, "promise")
	}
	if positioningStatement == "" && strategyData != nil {
		positioningStatement = gs(strategyData, "positioning")
	}

	// Logo concept info
	logoConceptName := ""
	logoMetaphor := ""
	logoSummary := ""
	if logoData != nil {
		logoConceptName = gs(logoData, "concept_name")
		logoMetaphor = gs(logoData, "metaphor")
		logoSummary = gs(logoData, "concept_summary")
	}

	// ─── Parijata mark SVG (simplified flower mark) ────────────────────────────
	parijataMark := `<svg viewBox="0 0 100 100" fill="none" style="width:80px;height:80px;display:inline-block;">
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(0 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(51.4 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(102.8 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(154.3 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(205.7 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(257.1 50 50)"/>
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="white" opacity="0.7" transform="rotate(308.6 50 50)"/>
    <circle cx="50" cy="50" r="8" fill="#f17022"/>
    <circle cx="50" cy="50" r="3" fill="white" opacity="0.7"/>
  </svg>`

	// ─── Build HTML sections ───────────────────────────────────────────────────

	// Helper: render a bullet list
	renderList := func(items []string, cls string) string {
		if len(items) == 0 {
			return ""
		}
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf(`<ul class="%s">`, cls))
		for _, item := range items {
			sb.WriteString(fmt.Sprintf(`<li>%s</li>`, htmlEsc(item)))
		}
		sb.WriteString(`</ul>`)
		return sb.String()
	}

	// Helper: color block
	colorBlocks := func() string {
		if len(colorsList) == 0 {
			return ""
		}
		var sb strings.Builder
		sb.WriteString(`<div class="color-grid">`)
		for _, c := range colorsList {
			hex := gs(c, "hex")
			if hex == "" {
				continue
			}
			name := gs(c, "creative_name")
			if name == "" {
				name = gs(c, "name")
			}
			why := gs(c, "why")
			sb.WriteString(fmt.Sprintf(`<div class="color-block">
        <div class="color-swatch" style="background:%s"></div>
        <div class="color-info">
          <div class="color-hex">%s</div>
          <div class="color-name">%s</div>
          %s
        </div>
      </div>`, htmlEsc(hex), htmlEsc(hex), htmlEsc(name), func() string {
				if why != "" {
					return fmt.Sprintf(`<div class="color-why">%s</div>`, htmlEsc(why))
				}
				return ""
			}()))
		}
		sb.WriteString(`</div>`)
		return sb.String()
	}

	// Helper: story sentences
	storyHTML := func() string {
		if len(story) == 0 {
			return ""
		}
		var sb strings.Builder
		sb.WriteString(`<div class="story-block">`)
		for _, s := range story {
			sb.WriteString(fmt.Sprintf(`<p class="story-sentence">%s</p>`, htmlEsc(s)))
		}
		sb.WriteString(`</div>`)
		return sb.String()
	}

	// Tone attributes pills
	toneAttributesHTML := func() string {
		if len(toneAttributes) == 0 {
			return ""
		}
		var sb strings.Builder
		sb.WriteString(`<div class="tone-pills">`)
		for _, attr := range toneAttributes {
			sb.WriteString(fmt.Sprintf(`<span class="tone-pill">%s</span>`, htmlEsc(attr)))
		}
		sb.WriteString(`</div>`)
		return sb.String()
	}

	// Logo display
	logoDisplay := func() string {
		if combinedSVG != "" {
			return fmt.Sprintf(`<div class="logo-render">%s</div>`, combinedSVG)
		}
		if wordmarkSVG != "" {
			return fmt.Sprintf(`<div class="logo-render">%s</div>`, wordmarkSVG)
		}
		if symbolSVG != "" {
			return fmt.Sprintf(`<div class="logo-render">%s</div>`, symbolSVG)
		}
		return fmt.Sprintf(`<div class="logo-text-fallback">%s</div>`, htmlEsc(displayName))
	}

	// Pairing why
	pairingWhy := ""
	if typographyData != nil {
		pairingWhy = gs(typographyData, "pairing_why")
		if pairingWhy == "" {
			pairingWhy = gs(typographyData, "font_pairing_why")
		}
	}

	// ─── Assemble final HTML ───────────────────────────────────────────────────

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>%s — Brand Identity Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&amp;family=Inter:wght@300;400;600;700&amp;family=%s:wght@400;700;900&amp;family=%s:wght@300;400;600&amp;display=swap" rel="stylesheet"/>
<style>
/* ─── RESET & BASE ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: 'Inter', sans-serif;
  background: #0a0a0a;
  color: #fff;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ─── PAGE SECTIONS ────────────────────────────────────── */
.page {
  min-height: 100vh;
  padding: 80px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  page-break-after: always;
}

.page-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #f17022;
  margin-bottom: 40px;
}

/* ─── COVER PAGE ───────────────────────────────────────── */
.cover {
  background: #0a0a0a;
  text-align: center;
  align-items: center;
}
.cover-mark { margin-bottom: 40px; }
.cover-brand {
  font-family: 'Playfair Display', serif;
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 20px;
}
.cover-tagline {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  color: rgba(255,255,255,0.45);
  font-style: italic;
  margin-bottom: 40px;
  max-width: 600px;
}
.cover-subtitle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  margin-bottom: 60px;
}
.cover-line {
  width: 80px;
  height: 3px;
  background: #f17022;
  border-radius: 2px;
  margin: 0 auto;
}
.cover-bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(241,112,34,0.06) 0%%, transparent 70%%);
  pointer-events: none;
}

/* ─── STANDARD SECTIONS ────────────────────────────────── */
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 40px;
  max-width: 800px;
}
.section-content {
  max-width: 800px;
}

/* ─── STRATEGY ──────────────────────────────────────────── */
.archetype-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #f17022;
  border: 1px solid rgba(241,112,34,0.3);
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 24px;
}
.strategy-body {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  margin-bottom: 24px;
}
.promise-block {
  background: rgba(241,112,34,0.06);
  border-left: 3px solid #f17022;
  border-radius: 0 12px 12px 0;
  padding: 20px 24px;
  margin: 32px 0;
}
.promise-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #f17022;
  margin-bottom: 10px;
}
.promise-text {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-style: italic;
  color: #fff;
}
.values-list, .tensions-list, .steps-list {
  list-style: none;
  margin-top: 16px;
}
.values-list li, .tensions-list li, .steps-list li {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 14px;
  color: rgba(255,255,255,0.55);
  padding-left: 20px;
  position: relative;
}
.values-list li::before {
  content: '●';
  position: absolute;
  left: 0;
  color: #f17022;
  font-size: 8px;
  top: 12px;
}
.tensions-list li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: rgba(255,255,255,0.2);
}
.steps-list { counter-reset: steps; }
.steps-list li {
  counter-increment: steps;
  padding-left: 32px;
}
.steps-list li::before {
  content: counter(steps);
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  background: #f17022;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: 50%%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 8px;
  line-height: 20px;
  text-align: center;
}

/* ─── NAMING ────────────────────────────────────────────── */
.naming-hero {
  font-family: 'Playfair Display', serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 12px;
}
.naming-meaning {
  font-size: 16px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
  margin-bottom: 32px;
  max-width: 600px;
}
.naming-meta {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.naming-meta-item { }
.naming-meta-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  margin-bottom: 6px;
}
.naming-meta-value {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
}

/* ─── COLORS ────────────────────────────────────────────── */
.color-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.color-block {
  flex: 1;
  min-width: 140px;
}
.color-swatch {
  height: 120px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.color-hex {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  margin-bottom: 4px;
}
.color-name {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  font-weight: 600;
  margin-bottom: 6px;
}
.color-why {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  line-height: 1.5;
}
.palette-name {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}
.palette-mood {
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  font-style: italic;
  margin-bottom: 32px;
}

/* ─── TYPOGRAPHY ────────────────────────────────────────── */
.type-sample-heading {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 24px;
}
.type-sample-body {
  font-size: 16px;
  color: rgba(255,255,255,0.5);
  line-height: 1.8;
  max-width: 600px;
  margin-bottom: 40px;
}
.type-pair {
  display: flex;
  gap: 40px;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 24px;
  flex-wrap: wrap;
}
.type-pair-item { }
.type-pair-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  margin-bottom: 6px;
}
.type-pair-value {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
}
.type-pairing-why {
  font-size: 13px;
  color: rgba(255,255,255,0.3);
  font-style: italic;
  margin-top: 16px;
}

/* ─── LOGO ──────────────────────────────────────────────── */
.logo-render {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  margin-bottom: 40px;
  min-height: 200px;
}
.logo-render svg { max-width: 400px; max-height: 200px; }
.logo-text-fallback {
  font-family: 'Playfair Display', serif;
  font-size: 64px;
  font-weight: 900;
  color: #fff;
  text-align: center;
  padding: 60px;
}
.logo-concept-name {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}
.logo-concept-body {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  line-height: 1.7;
  max-width: 600px;
}
.logo-grid {
  display: flex;
  gap: 20px;
  margin-top: 32px;
}
.logo-grid-item {
  flex: 1;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.logo-grid-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
}
.logo-grid-item svg { max-width: 120px; max-height: 60px; }

/* ─── VOICE ──────────────────────────────────────────────── */
.voice-name {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 900;
  color: #fff;
  margin-bottom: 12px;
}
.voice-desc {
  font-size: 15px;
  color: rgba(255,255,255,0.45);
  line-height: 1.7;
  margin-bottom: 32px;
  max-width: 600px;
}
.tone-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.tone-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.12);
  padding: 5px 14px;
  border-radius: 100px;
}
.copy-block {
  background: rgba(241,112,34,0.04);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  border: 1px solid rgba(241,112,34,0.08);
}
.copy-block-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  margin-bottom: 8px;
}
.copy-block-text {
  font-size: 15px;
  color: rgba(255,255,255,0.7);
  line-height: 1.6;
  font-style: italic;
}
.dos-donts {
  display: flex;
  gap: 32px;
  margin-top: 32px;
}
.dos-col, .donts-col { flex: 1; }
.dos-donts-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.dos-label { color: #4ade80; }
.donts-label { color: #f87171; }
.dos-list, .donts-list { list-style: none; }
.dos-list li, .donts-list li {
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  padding-left: 18px;
  position: relative;
  color: rgba(255,255,255,0.5);
}
.dos-list li::before { content: '✓'; position: absolute; left: 0; color: #4ade80; font-size: 11px; top: 8px; }
.donts-list li::before { content: '✗'; position: absolute; left: 0; color: #f87171; font-size: 11px; top: 8px; }

/* ─── SUMMARY ────────────────────────────────────────────── */
.positioning-block {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: rgba(255,255,255,0.7);
  line-height: 1.7;
  font-style: italic;
  max-width: 700px;
  margin-bottom: 40px;
  padding: 32px;
  background: rgba(255,255,255,0.02);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
}
.system-summary {
  font-size: 15px;
  color: rgba(255,255,255,0.4);
  line-height: 1.8;
  max-width: 600px;
  margin-bottom: 32px;
}

/* ─── DIVIDERS & UTIL ────────────────────────────────────── */
.divider {
  width: 60px;
  height: 3px;
  background: #f17022;
  border-radius: 2px;
  margin: 32px 0;
}
.two-col {
  display: flex;
  gap: 60px;
}
.two-col > * { flex: 1; }

/* ─── PRINT STYLES ───────────────────────────────────────── */
@media print {
  body {
    background: #fff !important;
    color: #0a0a0a !important;
  }
  .page {
    background: #fff !important;
    color: #0a0a0a !important;
    page-break-after: always;
    min-height: 100vh;
  }
  .cover { background: #0a0a0a !important; color: #fff !important; }
  .cover * { color: inherit !important; }
  .cover-bg-glow { display: none; }
  .section-title { color: #0a0a0a !important; }
  .strategy-body, .naming-meaning, .naming-meta-value,
  .logo-concept-body, .voice-desc, .system-summary { color: #444 !important; }
  .page-label { color: #f17022 !important; }
  .promise-block { background: #fff4ed !important; }
  .promise-text { color: #0a0a0a !important; }
  .copy-block { background: #fafafa !important; border-color: #f0e8e0 !important; }
  .copy-block-text { color: #444 !important; }
  .logo-render, .logo-grid-item { background: #fafafa !important; border-color: #eee !important; }
  .tone-pill { border-color: #ccc !important; color: #666 !important; }
  .color-swatch { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover-bg-glow, .cover-line { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .archetype-badge { border-color: #f17022 !important; }
  .positioning-block { background: #fafafa !important; border-color: #eee !important; color: #333 !important; }
  .values-list li, .tensions-list li, .steps-list li, .dos-list li, .donts-list li { color: #555 !important; }
  .naming-meta-label, .type-pair-label, .type-pairing-why, .color-why, .copy-block-label, .logo-grid-label, .logo-concept-body { color: #888 !important; }
  a { text-decoration: none; color: inherit !important; }
}

/* ─── SCREEN SCROLL ──────────────────────────────────────── */
@media screen {
  .page + .page { border-top: 1px solid rgba(255,255,255,0.04); }
}
</style>
</head>
<body>

<!-- ═══ PAGE 1: COVER ══════════════════════════════════════════════════════ -->
<section class="page cover">
  <div class="cover-bg-glow"></div>
  <div class="cover-mark">%s</div>
  <h1 class="cover-brand">%s</h1>
  <p class="cover-tagline">"%s"</p>
  <p class="cover-subtitle">Brand Identity Guide</p>
  <div class="cover-line"></div>
</section>

<!-- ═══ PAGE 2: STRATEGY ═══════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Brand Strategy</p>
  <div class="section-content">
    %s
    <h2 class="section-title">%s</h2>
    <p class="strategy-body">%s</p>
    %s
    %s
    %s
  </div>
</section>

<!-- ═══ PAGE 3: NAMING ═════════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Brand Naming</p>
  <div class="section-content">
    <h2 class="naming-hero">%s</h2>
    <p class="naming-meaning">%s</p>
    <div class="divider"></div>
    <div class="naming-meta">
      %s
      %s
      %s
    </div>
  </div>
</section>

<!-- ═══ PAGE 4: COLOR SYSTEM ══════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Color System</p>
  <div class="section-content">
    %s
    %s
    %s
    %s
  </div>
</section>

<!-- ═══ PAGE 5: TYPOGRAPHY ═════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Typography</p>
  <div class="section-content">
    <p class="type-sample-heading" style="font-family:'%s',serif;">%s</p>
    <p class="type-sample-body" style="font-family:'%s',sans-serif;">%s</p>
    <div class="type-pair">
      <div class="type-pair-item">
        <div class="type-pair-label">Heading</div>
        <div class="type-pair-value" style="font-family:'%s',serif;">%s</div>
      </div>
      <div class="type-pair-item">
        <div class="type-pair-label">Body</div>
        <div class="type-pair-value" style="font-family:'%s',sans-serif;">%s</div>
      </div>
    </div>
    %s
  </div>
</section>

<!-- ═══ PAGE 6: LOGO ═══════════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Logo System</p>
  <div class="section-content">
    %s
    %s
    %s
    %s
  </div>
</section>

<!-- ═══ PAGE 7: VOICE ══════════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Brand Voice</p>
  <div class="section-content">
    %s
    %s
    %s
    %s
    %s
    %s
    %s
  </div>
</section>

<!-- ═══ PAGE 8: SUMMARY ════════════════════════════════════════════════════ -->
<section class="page">
  <p class="page-label">Brand Summary</p>
  <div class="section-content">
    %s
    %s
    %s
    %s
    %s
  </div>
</section>

<script>
// Auto-open print dialog when page loads (optional, removed to let user choose)
// window.print();
</script>
</body>
</html>`,
		// Title
		htmlEsc(displayName),
		// Google Fonts — add headline and body fonts
		urlEnc(headlineFont), urlEnc(bodyFont),

		// ── Cover ──
		parijataMark,
		htmlEsc(displayName),
		htmlEsc(tagline),

		// ── Strategy ──
		func() string {
			if archetype != "" {
				return fmt.Sprintf(`<span class="archetype-badge">The %s</span>`, htmlEsc(archetype))
			}
			return ""
		}(),
		func() string {
			if archetype != "" {
				return fmt.Sprintf("The %s", htmlEsc(archetype))
			}
			return htmlEsc(displayName)
		}(),
		htmlEsc(positioning),
		func() string {
			if promise != "" {
				return fmt.Sprintf(`<div class="promise-block"><div class="promise-label">Brand Promise</div><div class="promise-text">%s</div></div>`, htmlEsc(promise))
			}
			return ""
		}(),
		func() string {
			if len(values) > 0 {
				return fmt.Sprintf(`<div style="margin-top:24px"><div class="copy-block-label" style="color:rgba(255,255,255,0.2);font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:8px;">Core Values</div>%s</div>`, renderList(values, "values-list"))
			}
			return ""
		}(),
		func() string {
			if len(tensions) > 0 {
				return fmt.Sprintf(`<div style="margin-top:24px"><div class="copy-block-label" style="color:rgba(255,255,255,0.2);font-size:9px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin-bottom:8px;">Brand Tensions</div>%s</div>`, renderList(tensions, "tensions-list"))
			}
			return ""
		}(),

		// ── Naming ──
		htmlEsc(displayName),
		htmlEsc(nameMeaning),
		func() string {
			if nameOrigin != "" {
				return fmt.Sprintf(`<div class="naming-meta-item"><div class="naming-meta-label">Origin</div><div class="naming-meta-value">%s</div></div>`, htmlEsc(nameOrigin))
			}
			return ""
		}(),
		func() string {
			if tagline != "" {
				return fmt.Sprintf(`<div class="naming-meta-item"><div class="naming-meta-label">Tagline</div><div class="naming-meta-value" style="font-style:italic;">"%s"</div></div>`, htmlEsc(tagline))
			}
			return ""
		}(),
		func() string {
			if domainAvailable != "" {
				return fmt.Sprintf(`<div class="naming-meta-item"><div class="naming-meta-label">Domain</div><div class="naming-meta-value">%s</div></div>`, htmlEsc(domainAvailable))
			}
			return ""
		}(),

		// ── Colors ──
		func() string {
			if n := gs(colorsData, "palette_name"); n != "" {
				return fmt.Sprintf(`<div class="palette-name">%s</div>`, htmlEsc(n))
			}
			return ""
		}(),
		func() string {
			if m := gs(colorsData, "mood"); m != "" {
				return fmt.Sprintf(`<div class="palette-mood">%s</div>`, htmlEsc(m))
			}
			return ""
		}(),
		colorBlocks(),
		func() string {
			if cn := gs(colorsData, "contrast_note"); cn != "" {
				return fmt.Sprintf(`<p style="margin-top:24px;font-size:12px;color:rgba(255,255,255,0.25);font-style:italic;">%s</p>`, htmlEsc(cn))
			}
			return ""
		}(),

		// ── Typography ──
		headlineFont, htmlEsc(sampleHeadline),
		bodyFont, htmlEsc(sampleBody),
		headlineFont, htmlEsc(headlineFont),
		bodyFont, htmlEsc(bodyFont),
		func() string {
			if pairingWhy != "" {
				return fmt.Sprintf(`<p class="type-pairing-why">%s</p>`, htmlEsc(pairingWhy))
			}
			return ""
		}(),

		// ── Logo ──
		logoDisplay(),
		func() string {
			if logoConceptName != "" {
				return fmt.Sprintf(`<div class="logo-concept-name">%s</div>`, htmlEsc(logoConceptName))
			}
			return ""
		}(),
		func() string {
			if logoMetaphor != "" {
				return fmt.Sprintf(`<p class="logo-concept-body" style="margin-bottom:8px;">Metaphor: <em>%s</em></p>`, htmlEsc(logoMetaphor))
			}
			return ""
		}(),
		func() string {
			if logoSummary != "" {
				return fmt.Sprintf(`<p class="logo-concept-body">%s</p>`, htmlEsc(logoSummary))
			}
			return ""
		}(),

		// ── Voice ──
		func() string {
			if voiceName != "" {
				return fmt.Sprintf(`<h3 class="voice-name">%s</h3>`, htmlEsc(voiceName))
			}
			return ""
		}(),
		func() string {
			if toneDescription != "" {
				return fmt.Sprintf(`<p class="voice-desc">%s</p>`, htmlEsc(toneDescription))
			}
			return ""
		}(),
		toneAttributesHTML(),
		func() string {
			if sampleCopyHeadline != "" {
				return fmt.Sprintf(`<div class="copy-block"><div class="copy-block-label">Headline</div><div class="copy-block-text">"%s"</div></div>`, htmlEsc(sampleCopyHeadline))
			}
			return ""
		}(),
		func() string {
			if sampleCopyProduct != "" {
				return fmt.Sprintf(`<div class="copy-block"><div class="copy-block-label">Product Description</div><div class="copy-block-text">%s</div></div>`, htmlEsc(sampleCopyProduct))
			}
			return ""
		}(),
		func() string {
			if sampleCopySocial != "" {
				return fmt.Sprintf(`<div class="copy-block"><div class="copy-block-label">Social Post</div><div class="copy-block-text">%s</div></div>`, htmlEsc(sampleCopySocial))
			}
			return ""
		}(),
		func() string {
			if len(dos) > 0 || len(donts) > 0 {
				return fmt.Sprintf(`<div class="dos-donts">
          <div class="dos-col"><div class="dos-donts-label dos-label">Do</div>%s</div>
          <div class="donts-col"><div class="dos-donts-label donts-label">Don't</div>%s</div>
        </div>`, renderList(dos, "dos-list"), renderList(donts, "donts-list"))
			}
			return ""
		}(),

		// ── Summary ──
		func() string {
			if positioningStatement != "" {
				return fmt.Sprintf(`<div class="positioning-block">%s</div>`, htmlEsc(positioningStatement))
			}
			return ""
		}(),
		func() string {
			if brandPromise != "" {
				return fmt.Sprintf(`<div class="promise-block"><div class="promise-label">Brand Promise</div><div class="promise-text">%s</div></div>`, htmlEsc(brandPromise))
			}
			return ""
		}(),
		storyHTML(),
		func() string {
			if systemSummary != "" {
				return fmt.Sprintf(`<p class="system-summary">%s</p>`, htmlEsc(systemSummary))
			}
			return ""
		}(),
		func() string {
			if len(nextSteps) > 0 {
				return fmt.Sprintf(`<div style="margin-top:32px"><div class="page-label" style="margin-bottom:16px;">Next Steps</div>%s</div>`, renderList(nextSteps, "steps-list"))
			}
			return ""
		}(),
	)

	// Suppress unused variable warnings
	_ = sampleCopyTagline
	_ = primaryHex
	_ = secondaryHex

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(200)
	w.Write([]byte(html))
}

// htmlEsc escapes HTML special characters
func htmlEsc(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}

// urlEnc encodes a font name for Google Fonts URL (replace spaces with +)
func urlEnc(s string) string {
	return strings.ReplaceAll(s, " ", "+")
}

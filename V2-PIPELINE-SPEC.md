# HowIconic v2 — Brand Generation Pipeline Specification

**Author:** Ram (AI Employee, Essdee)  
**Version:** 2.0  
**Date:** 2026-03-12  
**Status:** Draft for Nithin's Review  
**Stack:** Go · Gemini 2.5 Flash · React · SQLite · OpenAI API

---

> This is the blueprint for transforming HowIconic from a template-filler into a brand intelligence engine. The goal isn't "better output" — it's output that a Pentagram partner would look at and say "this is serious work."

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Multi-Step Generation Chain](#2-multi-step-generation-chain)
3. [Logo Generation Strategy](#3-logo-generation-strategy)
4. [Prompt Engineering (Full Text)](#4-prompt-engineering)
5. [Brand Manual Output Redesign](#5-brand-manual-output-redesign)
6. [Technical Architecture](#6-technical-architecture)
7. [Quality Benchmarks & Scoring](#7-quality-benchmarks--scoring)
8. [Implementation Phases](#8-implementation-phases)
9. [Cost Model](#9-cost-model)
10. [Data Structures (Go)](#10-data-structures-go)

---

## 1. Architecture Overview

### The Problem With v1

v1 is a single Gemini call that returns structured JSON. It's fast (3-5s), cheap (~$0.002), and produces technically correct output. But it's producing brand output the way a student fills a rubric — hitting every field without understanding why any of it matters.

The reason Nike, Apple, and Pentagram produce iconic brands isn't better templates. It's **sequential depth**: strategy informs naming, naming informs visual language, visual language informs the mark. Each step is non-reversible — you can't design a logo before you know what the brand believes.

v1 skips this. Everything happens at once, so nothing informs anything else.

### The v2 Mental Model

```
User Inputs
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Brand Strategy (Gemini)                            │
│  What is this brand? Who is it for? What gap does it fill?  │
└──────────────────────────┬──────────────────────────────────┘
                           │ strategy_context
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Naming & Verbal Identity (Gemini)                  │
│  What does this brand say? What is it called?               │
└──────────────────────────┬──────────────────────────────────┘
                           │ strategy_context + verbal_identity
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Visual Direction (Gemini)                          │
│  What does this brand look like — and WHY?                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ full_context + visual_system
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Logo Concepts (Gemini brief → DALL-E 3 render)     │
│  What is the mark?                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ full_context + logo_system
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Brand System Integration (Gemini)                  │
│  How does everything cohere? Where does it live?            │
└──────────────────────────┬──────────────────────────────────┘
                           │ complete_brand_system
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Quality Gate (Gemini self-review)                  │
│  Score ≥ 70? Ship. Score < 70? Re-run weak steps.           │
└──────────────────────────┬──────────────────────────────────┘
                           │ scored_brand_system
                           ▼
                    Brand Manual Output
                    (PDF-ready HTML + Assets)
```

**Key design principle:** Each step receives ALL previous step outputs as context. The final brand manual is an emergent document, not a template fill.

---

## 2. Multi-Step Generation Chain

### Step 1 — Brand Strategy

**Input:** User form data  
**Output:** `StrategyFoundation` struct  
**Model:** Gemini 2.5 Flash  
**Estimated tokens:** ~3,000 in / ~2,000 out  
**Time:** ~4s

The first step does the work that most agencies charge $15K for: competitive positioning, archetype identification, psychographic mapping, and finding the whitespace the brand can credibly own.

**User inputs consumed:**
- `essence` — what the brand fundamentally believes (e.g., "movement is medicine")
- `product_vessel` — what it sells (e.g., "compression activewear")
- `theme` — the world it lives in (e.g., "performance, India, discipline")
- `style_direction` — aesthetic instinct (e.g., "minimal, functional, not trend-driven")
- `target_description` — who it's for (e.g., "urban Indian athletes 22-35")
- `category` — the competitive set (e.g., "activewear", "fintech", "food brand")

**Output fields:**
```json
{
  "archetype": "The Warrior",
  "archetype_reasoning": "The brand believes suffering is a doorway to mastery...",
  "positioning_statement": "For the Indian athlete who trains without an audience...",
  "competitive_whitespace": "Indian activewear oscillates between cheap-functional and expensive-aspirational. There is no brand that treats the Indian body and the Indian climate as design constraints...",
  "target_psychographics": {
    "primary": "...",
    "secondary": "...",
    "anti_audience": "..."
  },
  "brand_tensions": ["Performance vs. Restraint", "Indian vs. Global"],
  "strategic_pillars": ["Earned Endurance", "Honest Materials", "Silent Strength"],
  "competitive_landscape": {
    "direct": ["Decathlon", "Under Armour India"],
    "indirect": ["Lululemon", "Nike India"],
    "displacement_opportunity": "..."
  },
  "brand_promise": "...",
  "cultural_context": "..."
}
```

---

### Step 2 — Naming & Verbal Identity

**Input:** `StrategyFoundation` + user inputs  
**Output:** `VerbalIdentity` struct  
**Model:** Gemini 2.5 Flash  
**Estimated tokens:** ~4,000 in / ~3,000 out  
**Time:** ~5s

Naming is the most permanent decision in branding. This step generates 5 candidates, runs each through a linguistic evaluation matrix, selects the strongest, and builds the full verbal system around it.

**Evaluation matrix per name candidate:**
- Phonetic quality (hard/soft, rhythm, syllable count)
- Etymology and origin (roots, meaning layers)
- Cultural valence (connotations in target market)
- Trademark class likelihood (is it likely free?)
- Memorability score (1-10)
- Domain availability pattern (is a `.com` version plausible?)
- Brand name category: coined / descriptive / evocative / experiential / acronym

**Output fields:**
```json
{
  "name_candidates": [
    {
      "name": "VAYU",
      "category": "evocative",
      "etymology": "Sanskrit. God of wind. The breath that precedes every movement.",
      "phonetic_quality": "Two syllables, open vowels. Crisp. Easy across languages.",
      "cultural_valence": "Deeply Indian without being regional. Universal enough for global play.",
      "memorability": 9,
      "domain_pattern": "vayu.in / getvayu.com",
      "brand_fit_score": 92,
      "reasoning": "..."
    }
  ],
  "selected_name": "VAYU",
  "selection_rationale": "...",
  "tagline": "Move like breath.",
  "tagline_rationale": "...",
  "alternative_taglines": ["Earn every inch.", "Built for the Indian body."],
  "brand_voice": {
    "tone": "Terse. Direct. No performance.",
    "vocabulary": "Short words. Active verbs. No adjectives that don't earn their place.",
    "anti_vocabulary": ["premium", "luxury", "world-class", "innovative"],
    "sentence_rhythm": "Short. Punchy. Then a long one to breathe.",
    "example_copy": "You don't need a cheering crowd. You need compression that doesn't give up at km 8."
  },
  "messaging_pillars": [
    {
      "pillar": "Earned Endurance",
      "message": "...",
      "proof_points": ["...", "..."]
    }
  ],
  "naming_story": "..."
}
```

---

### Step 3 — Visual Direction

**Input:** `StrategyFoundation` + `VerbalIdentity`  
**Output:** `VisualSystem` struct  
**Model:** Gemini 2.5 Flash  
**Estimated tokens:** ~5,000 in / ~4,000 out  
**Time:** ~6s

This is where most AI brand tools produce their worst work: "primary color: blue because trust." v2 generates color theory grounded in the strategy. Every visual decision is derived, not arbitrary.

**Output fields:**
```json
{
  "color_system": {
    "primary": {
      "name": "Iron Dusk",
      "hex": "#2D2D2D",
      "rgb": [45, 45, 45],
      "theory": "Near-black that reads as charcoal in daylight. Not fashion black — working black. The color of a barbell before dawn, of concrete under fluorescents. It anchors everything without announcing itself.",
      "psychological_effect": "Authority without intimidation. Seriousness without formality.",
      "usage": "Primary text, primary backgrounds, product colorways",
      "why_not_pure_black": "Pure black is theatrical. This is functional."
    },
    "secondary": {
      "name": "Compression Orange",
      "hex": "#E8521A",
      "theory": "The one place VAYU shows warmth. Derived from the color of clay courts and dusty tracks — Indian athletic infrastructure. High-contrast against Iron Dusk. Used sparingly so it carries weight when it appears.",
      "usage": "CTA elements, accent on product, campaign moments"
    },
    "tertiary": {
      "name": "Sweat White",
      "hex": "#F4F2EE",
      "theory": "Off-white because pure white is sterile. This reads as clean but lived-in."
    },
    "extended_palette": "...",
    "color_dont": "Never use more than 2 palette colors in a single composition. Never use gradients.",
    "color_accessibility": "WCAG AA compliant primary/background combinations"
  },
  "typography": {
    "primary_typeface": {
      "family": "Neue Haas Grotesk",
      "style": "Display Medium + Text Regular",
      "rationale": "The Swiss grotesque tradition — no personality, maximum clarity. The brand's personality comes from the words, not the letterforms. This is a feature, not a limitation.",
      "fallback": "Inter (open source), system-ui",
      "usage": "Headlines, product names, navigation"
    },
    "secondary_typeface": {
      "family": "Fraunces",
      "style": "Light Italic",
      "rationale": "Old-style serif for moments requiring warmth — the brand story, pull quotes, the naming rationale. The pairing tension: cold grotesque + warm serif. Discipline and humanity.",
      "usage": "Long-form text, brand story sections, editorial"
    },
    "type_scale": {
      "display": "72px / 1.1 leading",
      "headline": "48px / 1.2 leading",
      "subhead": "24px / 1.4 leading",
      "body": "16px / 1.6 leading",
      "caption": "12px / 1.5 leading"
    },
    "typographic_rules": [
      "All-caps for product category labels only",
      "Numbers always tabular figures",
      "Tracking: -0.02em for display, 0 for body"
    ]
  },
  "spatial_principles": {
    "grid": "8px base unit. Everything sits on the grid.",
    "white_space": "Generous. White space is not emptiness — it's the brand breathing.",
    "layout_ratio": "Golden ratio for hero compositions. 3-column for editorial.",
    "visual_density": "Low. One message per visual surface."
  },
  "texture_direction": {
    "primary_texture": "None. Surfaces are clean.",
    "accent_texture": "Subtle fabric weave pattern derived from compression textile structure — used only in brand story contexts, never on product.",
    "photography_style": "High contrast, natural light, no studio polish. Athletes in real environments. Sweat is visible. No smiling at camera."
  },
  "iconography": {
    "style": "Single-weight line icons. No fill. 2px stroke at 24px.",
    "character": "Geometric but not cold. Rounded terminals.",
    "grid": "24x24px with 2px padding"
  },
  "visual_keywords": ["restraint", "earned", "functional", "Indian", "silent"],
  "visual_anti_keywords": ["luxurious", "playful", "soft", "global generic", "neon"]
}
```

---

### Step 4 — Logo Concepts

**Input:** All previous steps  
**Output:** `LogoSystem` struct + 3 rendered images  
**Models:** Gemini 2.5 Flash (conceptual brief) + DALL-E 3 (rendering)  
**Estimated tokens:** ~6,000 in / ~2,000 out (Gemini) + 3× DALL-E 3 calls  
**Time:** ~20s (parallel DALL-E calls)

This step has two phases: Gemini generates 3 conceptual briefs with geometric rationale, negative space thinking, and mark philosophy. Then those briefs are translated into DALL-E 3 prompts for actual visual output.

#### Phase 4a — Conceptual Brief Generation (Gemini)

For each of 3 concepts, output:
```json
{
  "concept_id": "A",
  "concept_name": "The Exhale",
  "mark_philosophy": "The act of controlled breathing as the source of athletic performance. The mark captures the moment of exhale — release, not effort.",
  "geometric_description": "A single curved stroke, like a brushstroke mid-breath. Not a swoosh — thinner, more deliberate, with a slight weight variation suggesting hand-drawn precision over corporate smoothness.",
  "negative_space_idea": "The white space within the curve suggests a lung, readable only after a moment of looking.",
  "scalability_notes": "Works at 12px as a monogram indicator. The curve becomes a pure geometric mark at small sizes.",
  "color_application": "Iron Dusk on Sweat White for primary. Reversed for dark applications. Never in color.",
  "personality": "Meditative. Earned. Not aggressive — controlled.",
  "what_it_avoids": "Not dynamic. Not a checkmark. Not a lightning bolt. The brand does not scream.",
  "dalle_prompt": "Minimal logo mark design: a single precise curved brushstroke with subtle weight variation, like a controlled exhale captured as geometry. Ultra-clean, white background, single dark charcoal (#2D2D2D) stroke, no text, no fill, high contrast, professional brand identity design, SVG-quality precision, isolated mark on pure white, no shadows, no gradients. Style: Swiss modernist, Pentagram-quality mark design.",
  "dalle_negative": "swoosh, Nike, checkmark, lightning bolt, filled shapes, gradient, drop shadow, 3D effect, letter forms, complex illustration, busy, decorative"
}
```

#### Phase 4b — DALL-E 3 Rendering

Each concept's `dalle_prompt` is passed to DALL-E 3 with these fixed parameters:
```json
{
  "model": "dall-e-3",
  "prompt": "<concept.dalle_prompt>",
  "n": 1,
  "size": "1024x1024",
  "quality": "hd",
  "style": "natural",
  "response_format": "url"
}
```

Three calls run in parallel (Go goroutines). Images are fetched and stored in SQLite as base64 blobs.

#### Phase 4c — Wordmark Generation

The selected name is typeset programmatically using the primary typeface at display scale. This is NOT DALL-E — it's precise SVG text rendering via Go's `github.com/tdewolff/canvas` library (or equivalent), ensuring:
- Exact font rendering
- Letter spacing control
- Clean SVG output for scalability

#### Final Logo System Output:
```json
{
  "selected_concept": "A",
  "selection_rationale": "...",
  "mark_variations": {
    "symbol": "<base64 PNG or SVG path>",
    "wordmark": "<SVG string>",
    "combined_horizontal": "<SVG string>",
    "combined_stacked": "<SVG string>",
    "monogram": "<SVG string>"
  },
  "clear_space": "Minimum clear space equals the cap-height of the wordmark 'V' on all sides.",
  "minimum_size": {
    "digital": "32px height for combined mark",
    "print": "8mm height for combined mark"
  },
  "color_variants": ["dark-on-light", "light-on-dark", "single-color-dark", "single-color-light"],
  "incorrect_usage": ["Do not rotate", "Do not stretch", "Do not add effects", "Do not use on busy backgrounds"]
}
```

---

### Step 5 — Brand System Integration

**Input:** All previous steps  
**Output:** `BrandSystem` struct  
**Model:** Gemini 2.5 Flash  
**Estimated tokens:** ~8,000 in / ~5,000 out  
**Time:** ~8s

This step writes the narrative that ties everything together. It's not just a summary — it's the layer of meaning that makes the brand manual feel authored, not assembled.

**Output fields:**
```json
{
  "brand_story": {
    "headline": "...",
    "narrative": "600-800 word brand origin story written in the brand's voice",
    "arc": "problem → insight → conviction → brand"
  },
  "system_coherence_notes": "Why the orange is earned, not chosen. Why the typography is cold on purpose. Why the name sounds like breath.",
  "application_scenarios": [
    {
      "context": "Hang tag",
      "description": "Single side. Black. Name in white. Tagline below. No barcode on front — utility lives on the back.",
      "visual_direction": "..."
    },
    {
      "context": "App loading screen",
      "description": "...",
      "visual_direction": "..."
    },
    {
      "context": "Instagram square post",
      "description": "...",
      "visual_direction": "..."
    },
    {
      "context": "Race bib",
      "description": "...",
      "visual_direction": "..."
    }
  ],
  "brand_dos": ["...", "..."],
  "brand_donts": ["...", "..."],
  "evolution_notes": "How this brand grows. What becomes more refined over 5 years, what stays constant.",
  "brand_in_culture": "Where this brand belongs. What shelf it sits on. What playlist it plays in."
}
```

---

### Step 6 — Quality Gate

**Input:** Complete `BrandSystem` (all steps combined)  
**Output:** `QualityScore` struct  
**Model:** Gemini 2.5 Flash  
**Estimated tokens:** ~10,000 in / ~1,500 out  
**Time:** ~5s

The quality gate is a structured self-critique. Gemini is asked to evaluate the complete brand system against 10 dimensions. If the total score is below 70/100, the pipeline identifies the weakest steps and re-runs them with regeneration context.

**Scoring dimensions** (see Section 7 for full rubric):
1. Uniqueness (is this brand distinct from its competitive set?)
2. Coherence (do all parts feel like they came from the same mind?)
3. Memorability (will this be remembered after one encounter?)
4. Strategic Clarity (does the strategy actually differentiate?)
5. Naming Quality (is the name excellent, or just acceptable?)
6. Visual Distinction (does the visual system have a point of view?)
7. Logo Strength (could the mark stand alone as a brand indicator?)
8. Voice Authenticity (does the copy sound like a real brand, not a template?)
9. Cultural Sensitivity (no appropriation, no unintended resonance?)
10. Scalability (will this system grow?)

**Output:**
```json
{
  "scores": {
    "uniqueness": 8,
    "coherence": 9,
    "memorability": 7,
    "strategic_clarity": 9,
    "naming_quality": 8,
    "visual_distinction": 7,
    "logo_strength": 6,
    "voice_authenticity": 8,
    "cultural_sensitivity": 9,
    "scalability": 8
  },
  "total": 79,
  "passed": true,
  "weak_steps": ["logo_strength", "visual_distinction"],
  "critique": {
    "strengths": ["...", "..."],
    "weaknesses": ["The logo concept C feels derivative — the double-line motif appears in 3 competitor marks...", "..."],
    "improvement_notes": ["Re-run logo generation with stronger constraint on uniqueness from competitors...", "..."]
  },
  "regeneration_needed": false
}
```

**Regeneration logic:** If `total < 70`, re-run the steps identified in `weak_steps` with additional context from `critique.improvement_notes`. Maximum 2 regeneration cycles to prevent infinite loops.

---

## 3. Logo Generation Strategy

### Options Analysis

| Approach | Quality | SVG Output | Cost | Speed | Controllability |
|---|---|---|---|---|---|
| DALL-E 3 (raster) | High | No (needs vectorization) | ~$0.08/image | Fast | Medium |
| Midjourney API | Very High | No | No public API | Slow | Low |
| Custom SVG algorithm | Medium | Yes, native | Near-zero | Fast | Very High |
| Gemini Imagen | Good | No | Included | Fast | Medium |
| DALL-E 3 + vectorization | High | Yes (post-process) | ~$0.12/image | Medium | Medium |
| Hybrid: DALL-E 3 + SVG wordmark | High | Partial | ~$0.10/image | Fast | High |

### Recommendation: DALL-E 3 + SVG Wordmark Hybrid

**Rationale:**
- Midjourney has no public API. Out.
- Pure SVG algorithms produce the same geometric shapes we're trying to escape. Out for symbol marks (keep for wordmarks).
- Gemini Imagen is improving but trails DALL-E 3 for precision mark design.
- DALL-E 3 produces the highest quality marks with the right prompts. The HD quality option gets close to professional-grade.
- Vectorization: Use Potrace (open source, Go bindings available via `github.com/tailscale/potrace` or shell call) to convert PNG marks to SVG post-generation. Quality is acceptable for symbols at this scale.

**Implementation:**
1. DALL-E 3 generates 3 symbol mark concepts (PNG 1024x1024, HD)
2. Potrace converts each PNG to SVG path
3. Wordmark is rendered as clean SVG using Go text rendering with the brand typeface
4. Combined marks are assembled programmatically: SVG symbol + SVG wordmark, positioned by grid rules

**Vectorization command:**
```bash
potrace --svg --tight --unit 1 input.pbm -o output.svg
```
Pre-processing: convert DALL-E PNG → greyscale → threshold → PBM → Potrace → SVG

**Known limitation:** Potrace works best on high-contrast, clean marks. The DALL-E prompts must enforce this: white background, single dark color, no gradients, no fills. If the mark is too complex, vectorization degrades. The prompt engineering section addresses this.

### Logo Deliverables Per Brand

| Variant | Format | Generation Method |
|---|---|---|
| Symbol mark (3 options) | SVG (via DALL-E + Potrace) | AI generated |
| Wordmark | SVG | Programmatic text rendering |
| Combined mark (horizontal) | SVG | Assembled programmatically |
| Combined mark (stacked) | SVG | Assembled programmatically |
| Monogram | SVG | Programmatic (first letter/initials) |
| Favicon | PNG 32x32 | Rasterized from SVG |
| App icon | PNG 1024x1024 | Rasterized from SVG with padding |

---

## 4. Prompt Engineering

### General Principles

Every prompt in this pipeline follows four rules:
1. **Role definition first** — tell Gemini who it is and what its output will be used for
2. **Context injection** — previous step outputs are injected verbatim, not summarized
3. **Format contract** — output format is specified precisely, with a JSON schema
4. **Negative constraints** — explicitly forbid generic/safe/cliché outputs

---

### Step 1 Prompt — Brand Strategy

```
You are a senior brand strategist at a Pentagram-calibre firm. You have studied 10,000 brand cases and your work has defined category leaders. Your job is to identify the strategic foundation of a brand — not from templates, but from genuine insight about the space, the audience, and the gap that exists.

You are NOT producing a template. You are thinking about this specific brand in its actual competitive context.

USER INPUTS:
- Brand essence: {{essence}}
- Product/service: {{product_vessel}}
- Theme/world: {{theme}}
- Style instinct: {{style_direction}}
- Target audience: {{target_description}}
- Category: {{category}}
- Geography: {{geography}}

YOUR TASK:
Produce a strategic foundation document. Think carefully before writing. Ask yourself:
1. What is genuinely different about this brand vs. every existing player in {{category}}?
2. What is the real reason someone would choose this brand over what already exists?
3. What is the brand NOT? (Anti-positioning is as important as positioning.)
4. Which brand archetype actually fits — not the first one that comes to mind, but the one that fits after examining the others?

WORLD-CLASS EXAMPLE (for format reference — this is NOT your output):
For a boutique Indian trekking gear brand:
- Archetype: The Explorer (not Warrior — exploration is about wonder, not conquest)
- Whitespace: "Every Indian outdoor brand either appeals to hobbyists or tries to be a cheaper North Face. None treat the Indian mountain geography itself as the design brief."
- Anti-audience: "Not for weekend hiking Instagram influencers. For people who go quiet when the view is good."
- Positioning: "Gear that knows the Western Ghats isn't the Rockies."

AVOID:
- Generic archetypes applied without reasoning ("The Hero" without justification)
- Vague positioning ("premium quality at accessible price")
- Safe psychographics ("millennials who value authenticity")
- Competitive analysis that lists obvious players without insight

OUTPUT FORMAT (strict JSON, no markdown wrapper):
{
  "archetype": string,
  "archetype_reasoning": string (min 100 words, explain why this archetype and why NOT the obvious alternatives),
  "positioning_statement": string (one sentence, specific and falsifiable),
  "competitive_whitespace": string (min 150 words, specific gaps in the actual market),
  "target_psychographics": {
    "primary": string (specific, behavioral, not demographic),
    "secondary": string,
    "anti_audience": string (who this brand will actively NOT appeal to)
  },
  "brand_tensions": string[] (2-3 productive tensions the brand lives inside),
  "strategic_pillars": string[] (3 pillars, each named and explained in 50 words),
  "competitive_landscape": {
    "direct": string[],
    "indirect": string[],
    "displacement_opportunity": string
  },
  "brand_promise": string,
  "cultural_context": string (min 100 words — what cultural moment does this brand belong to?)
}
```

---

### Step 2 Prompt — Naming & Verbal Identity

```
You are a naming director at a world-class brand consultancy. You have named brands across 20 categories. You understand that naming is linguistics, psychology, culture, and competitive positioning compressed into a single word.

STRATEGIC FOUNDATION (from Step 1):
{{strategy_json}}

USER CONTEXT:
- Essence: {{essence}}
- Product: {{product_vessel}}
- Geography/culture: {{geography}}
- Languages spoken by target: {{languages}}

YOUR TASK:
Generate 5 distinct name candidates. Each must come from a different naming strategy (coined, descriptive, evocative, experiential, borrowed/adapted). Evaluate each honestly. Select the strongest.

WHAT MAKES A GREAT BRAND NAME:
- Phonetically satisfying: good sound, good rhythm, memorable cadence
- Orthographically clean: easy to spell after hearing, no ambiguous letters
- Culturally layered: means something beyond its surface, ideally in multiple languages
- Competitively open: no obvious trademark conflicts, plausible domain availability
- Scalable: works for a company, a product, a movement

WORLD-CLASS EXAMPLES (reference only):
- SONY: "sonus" (Latin, sound) + Japanese "sonny" (bright young man). Two cultural layers compressed.
- NIKE: Greek goddess of victory. One word. Three letters in logo. Universe of meaning.
- VAIO: "Video Audio Integrated Operation." Acronym that sounds like a proper name. Rare win.
- ZARA: Founder Amancio named after favorite film "Zorba" — but the name works because of its sound, not its story.

AVOID:
- Names that end in -ify, -ly, -io (saturated startup space)
- Names that are just two common words stuck together
- Generic virtue words (Pure, True, Real, Smart)
- Anything that requires explanation to feel meaningful

OUTPUT FORMAT (strict JSON):
{
  "name_candidates": [
    {
      "name": string,
      "category": "coined|descriptive|evocative|experiential|borrowed",
      "etymology": string,
      "phonetic_quality": string,
      "cultural_valence": string (specific — what does this word mean or feel like in the target market's language/culture?),
      "trademark_risk": "low|medium|high",
      "domain_pattern": string (suggest 2-3 domain variations),
      "memorability": number (1-10),
      "brand_fit_score": number (1-100),
      "reasoning": string (min 80 words)
    }
  ],
  "selected_name": string,
  "selection_rationale": string (min 150 words — why this name beats the others specifically),
  "tagline": string,
  "tagline_rationale": string (why these specific words, why this rhythm),
  "alternative_taglines": string[],
  "brand_voice": {
    "tone": string,
    "vocabulary": string (specific words this brand uses and why),
    "anti_vocabulary": string[] (words this brand never says, with reasons),
    "sentence_rhythm": string,
    "example_copy": string (3-4 sentences of actual brand copy in this voice)
  },
  "messaging_pillars": [
    {
      "pillar": string,
      "message": string,
      "proof_points": string[]
    }
  ],
  "naming_story": string (min 200 words — the narrative of how the name was chosen, written for the brand manual)
}
```

---

### Step 3 Prompt — Visual Direction

```
You are the creative director of a design studio that works exclusively on brand identity. You think about color theory, typography, spatial relationships, and visual language as strategic decisions — not aesthetic preferences.

BRAND CONTEXT:
Strategy: {{strategy_json}}
Verbal Identity: {{verbal_identity_json}}

YOUR TASK:
Define the complete visual language for this brand. Every decision must be derived from the strategic and verbal identity. "Because it looks good" is not acceptable reasoning. 

FRAMEWORK FOR COLOR DECISIONS:
- Color carries cultural meaning that varies by geography
- Color carries psychological effect (activation, calm, trust, warmth)
- Color carries category coding (blue = tech/trust, green = health/nature — these can be used or deliberately broken)
- Color carries temporal positioning (certain palettes read as specific eras)
A good color choice works on all four levels.

FRAMEWORK FOR TYPOGRAPHY DECISIONS:
- Typefaces carry personality: grotesque = neutral/modern, serif = authority/tradition, display = distinctive/risky
- Type pairing creates tension: the relationship between typefaces should mirror a brand tension
- Readability is a strategic choice — difficult type communicates difficulty; easy type communicates access
- Type is the cheapest brand element that most brands get wrong

WORLD-CLASS REFERENCE (NOT to copy — to understand the reasoning quality):
AESOP: 
- Color: brown kraft, pharmacy green. References the apothecary tradition of the brand's ingredients. Refuses beauty-industry pink. The palette says "laboratory" not "boutique."
- Typography: Univers (grotesque) for product + Caslon (old-style serif) for editorial. The tension between clinical precision and literary tradition is the brand.
- Spatial principles: vast white space. Products displayed like museum objects. White space is the luxury.

AVOID:
- Blue for trust, green for nature, red for energy (default category codes used without subversion)
- Generic sans-serif + serif pairing with no rationale
- "Minimal and clean" as an end in itself (it must mean something)
- Palettes that could belong to any brand in the category

OUTPUT FORMAT (strict JSON):
{
  "color_system": {
    "primary": {
      "name": string (name it — don't just give hex),
      "hex": string,
      "rgb": [r, g, b],
      "theory": string (min 100 words — psychological + cultural + competitive reasoning),
      "psychological_effect": string,
      "usage": string,
      "why_not_alternatives": string (why not the obvious color choice for this category?)
    },
    "secondary": { same structure },
    "tertiary": { same structure },
    "extended_palette": {
      "tints": string[] (hex values, 3-4),
      "neutral": string (hex),
      "usage_rules": string
    },
    "color_dont": string,
    "color_accessibility": string
  },
  "typography": {
    "primary_typeface": {
      "family": string,
      "weights_used": string[],
      "rationale": string (min 100 words),
      "open_source_alternative": string,
      "usage": string
    },
    "secondary_typeface": {
      "family": string,
      "weights_used": string[],
      "rationale": string (why THIS pairing — what is the tension/relationship?),
      "open_source_alternative": string,
      "usage": string
    },
    "type_scale": {
      "display": string,
      "headline": string,
      "subhead": string,
      "body": string,
      "caption": string,
      "label": string
    },
    "typographic_rules": string[]
  },
  "spatial_principles": {
    "grid": string,
    "white_space": string,
    "layout_ratios": string,
    "visual_density": string,
    "spatial_reasoning": string (why these spatial choices match the brand?)
  },
  "texture_and_material": {
    "primary_surface": string,
    "accent_texture": string,
    "material_palette": string,
    "what_materials_say": string
  },
  "photography_direction": {
    "style": string,
    "lighting": string,
    "subject_treatment": string,
    "color_grading": string,
    "what_to_avoid": string
  },
  "iconography": {
    "style": string,
    "grid": string,
    "weight": string,
    "character": string
  },
  "visual_keywords": string[],
  "visual_anti_keywords": string[],
  "moodboard_description": string (200 words — describe the moodboard for this brand so a designer could source it)
}
```

---

### Step 4 Prompt — Logo Concepts (Conceptual Phase)

```
You are a mark designer at a world-class identity studio. You have designed marks that have been used for decades — marks that work at 16px and at 100 feet. You think about logos as compressed meaning, not decoration.

COMPLETE BRAND CONTEXT:
Strategy: {{strategy_json}}
Verbal Identity: {{verbal_identity_json}}
Visual System: {{visual_system_json}}

YOUR TASK:
Generate 3 logo mark concepts. Each must be conceptually distinct — not variations, but different ideas. Each must have:
1. A clear conceptual territory (what does this mark mean?)
2. A geometric description precise enough for a designer to sketch it
3. A negative space or hidden element idea
4. A DALL-E prompt that will produce a clean, vectorizable mark

THE MARKS YOU ARE NOT ALLOWED TO MAKE:
- Letterforms in geometric shapes (this is v1. We're past this.)
- Abstract swooshes
- Generic icons from the Noun Project vocabulary
- Anything that looks like it was designed in 10 minutes

MARKS TO STUDY FOR REASONING QUALITY (not style):
- FedEx: hidden arrow in negative space. The brand delivers. The mark proves it before you read it.
- NBC: peacock. Multi-color feathers = multiple networks. The meaning IS the form.
- WWF: panda. Endangered = precious. The mark is the cause.
- Chanel: interlocking Cs. Two people facing away and toward each other. Tension and unity.

OUTPUT FORMAT (strict JSON, array of 3 concepts):
[
  {
    "concept_id": "A",
    "concept_name": string,
    "mark_philosophy": string (min 150 words — what does this mark mean and why?),
    "geometric_description": string (precise enough to reproduce: angles, proportions, weights, relationships),
    "negative_space_idea": string,
    "hidden_element": string (optional — what can you see after looking longer?),
    "scalability_notes": string,
    "color_application": string,
    "personality": string,
    "what_it_avoids": string,
    "dalle_prompt": string (a precise prompt for DALL-E 3 that will produce: clean white background, single color mark, minimal, vectorizable, professional identity mark),
    "dalle_negative_prompt": string
  }
]
```

---

### Step 6 Prompt — Quality Gate

```
You are a brand critic with 25 years of experience reviewing identity work. You have reviewed Pentagram projects, startup rebrands, and everything in between. You are honest — you have killed many projects that weren't ready.

You are reviewing a complete brand identity system. Your job is not to be encouraging. Your job is to be accurate.

COMPLETE BRAND SYSTEM:
{{complete_brand_system_json}}

SCORE EACH DIMENSION 1-10:
1. Uniqueness: Is this brand genuinely distinct from its competitive set, or could it be mistaken for an existing brand?
2. Coherence: Do all parts (strategy, name, visual, logo, voice) feel like they came from the same mind, the same idea?
3. Memorability: Would someone remember this brand after one encounter?
4. Strategic Clarity: Is the positioning specific and defensible, or is it vague and safe?
5. Naming Quality: Is the name excellent (9-10), good (7-8), acceptable (5-6), or weak (1-4)?
6. Visual Distinction: Does the visual system have a point of view, or is it generic professional design?
7. Logo Strength: Could the mark stand alone as a brand indicator after 5 years of exposure?
8. Voice Authenticity: Does the copy sound like a real brand with a real perspective, or like a template?
9. Cultural Sensitivity: No appropriation, no unintended negative associations, no cultural mismatch?
10. Scalability: Will this system work across physical, digital, and environmental applications?

SCORING GUIDE:
9-10: World-class. Nike/Apple/Pentagram territory. Rare.
7-8: Strong professional work. Would pass agency review.
5-6: Functional. Gets the job done. Not memorable.
3-4: Generic. Safe. Forgettable.
1-2: Weak. Would embarrass the brand.

OUTPUT FORMAT (strict JSON):
{
  "scores": {
    "uniqueness": number,
    "coherence": number,
    "memorability": number,
    "strategic_clarity": number,
    "naming_quality": number,
    "visual_distinction": number,
    "logo_strength": number,
    "voice_authenticity": number,
    "cultural_sensitivity": number,
    "scalability": number
  },
  "total": number,
  "passed": boolean (true if total >= 70),
  "weak_steps": string[] (step names that scored below 6),
  "critique": {
    "strengths": string[] (specific, not generic praise),
    "weaknesses": string[] (specific, actionable critique),
    "improvement_notes": string[] (specific instruction for re-running weak steps)
  },
  "regeneration_needed": boolean,
  "critical_failure": string|null (if any dimension scores 3 or below, describe the failure)
}
```

---

## 5. Brand Manual Output Redesign

### Design Philosophy

The v1 brand manual is a data dump with styling. The v2 manual is a published document that tells a story. Every section earns its place. Nothing is there because "brand manuals have this section" — everything is there because the brand needs it.

**Reference:** Pentagram's work for the Saks Fifth Avenue identity. Each element of the identity had its own narrative. The brand manual read like a design monograph.

### Document Structure

```
┌─────────────────────────────────────────┐
│  COVER                                  │
│  Brand name, large. Tagline, small.     │
│  Nothing else.                          │
└─────────────────────────────────────────┘
│  01 — BRAND STORY                       │
│  The origin narrative. 600-800 words.   │
│  Written in the brand's own voice.      │
│  Not a history — a conviction.          │
├─────────────────────────────────────────┤
│  02 — STRATEGY FOUNDATION               │
│  Positioning statement (large, framed)  │
│  Archetype with visual reference        │
│  Competitive whitespace as a map        │
│  Target psychographic portraits         │
│  Strategic pillars with rationale       │
├─────────────────────────────────────────┤
│  03 — NAMING RATIONALE                  │
│  The name in large type                 │
│  Etymology diagram                      │
│  Phonetic analysis                      │
│  Cultural layering                      │
│  Naming story narrative                 │
├─────────────────────────────────────────┤
│  04 — VISUAL SYSTEM                     │
│  Color — each swatch with full theory   │
│  Typography — specimens + reasoning     │
│  Grid & spatial principles              │
│  Texture & material direction           │
│  Photography direction with examples    │
├─────────────────────────────────────────┤
│  05 — LOGO SYSTEM                       │
│  Primary mark — large, with meaning     │
│  All variants on white and black        │
│  Clear space diagram                    │
│  Minimum size guide                     │
│  Color variants                         │
│  Construction grid (if applicable)      │
├─────────────────────────────────────────┤
│  06 — VOICE & TONE                      │
│  Voice principles                       │
│  Vocabulary (use / don't use)           │
│  Example copy across 5 contexts         │
│  Messaging pillars                      │
├─────────────────────────────────────────┤
│  07 — APPLICATIONS                      │
│  8-10 application mockup descriptions   │
│  Physical: packaging, tags, signage     │
│  Digital: app, social, web              │
│  Environmental: retail, events          │
├─────────────────────────────────────────┤
│  08 — BRAND GUIDELINES                  │
│  20 specific Do's                       │
│  20 specific Don'ts                     │
│  Decision framework for edge cases      │
└─────────────────────────────────────────┘
```

### Technical Output Format

The brand manual is generated as a **self-contained HTML document** with:
- All fonts embedded as base64 (or loaded from Google Fonts with fallback)
- All brand assets (logos, color swatches) rendered inline
- CSS Grid layout for professional multi-column sections
- Print-optimized CSS (`@media print` rules)
- PDF export via headless Chrome (`chromium --print-to-pdf`)

The manual file is stored in SQLite as a blob with a separate `brand_assets` table for logos.

### Section Rendering Pattern

Each section is a Go template that receives the relevant step output struct. The templates are rich HTML, not just data display. Example for the color section:

```html
<section class="color-system">
  <div class="section-header">
    <span class="section-number">04</span>
    <h2>The Color System</h2>
    <p class="section-intro">Color is not decoration. Every shade here is an argument.</p>
  </div>
  
  {{range .Colors}}
  <div class="color-block" style="background: {{.Hex}}">
    <div class="color-meta">
      <span class="color-name">{{.Name}}</span>
      <span class="color-hex">{{.Hex}}</span>
    </div>
  </div>
  <div class="color-theory">
    <h3>{{.Name}}</h3>
    <p>{{.Theory}}</p>
    <div class="color-usage">
      <strong>Where:</strong> {{.Usage}}
    </div>
    <div class="color-why-not">
      <strong>Why not {{.Obvious}}?</strong> {{.WhyNotAlternatives}}
    </div>
  </div>
  {{end}}
</section>
```

---

## 6. Technical Architecture

### API Endpoint Design

```
POST /api/v2/brands/generate
Content-Type: application/json

{
  "essence": string,
  "product_vessel": string,
  "theme": string,
  "style_direction": string,
  "target_description": string,
  "category": string,
  "geography": string,
  "languages": string[],
  "options": {
    "logo_concepts": 3,          // 1-3
    "name_candidates": 5,        // 3-5
    "regeneration_limit": 2      // max quality gate re-runs
  }
}

Response: 202 Accepted
{
  "generation_id": "gen_abc123",
  "stream_url": "/api/v2/brands/gen_abc123/stream",
  "status_url": "/api/v2/brands/gen_abc123/status"
}
```

### Server-Sent Events (SSE) Stream

**Decision: SSE over WebSocket**

Rationale: This is a unidirectional data flow (server → client). SSE is simpler, auto-reconnects, works over HTTP/2, and requires no additional library. WebSockets add complexity with no benefit for this use case.

```
GET /api/v2/brands/gen_abc123/stream
Accept: text/event-stream

--- Server sends: ---

event: step_start
data: {"step": 1, "name": "brand_strategy", "estimated_seconds": 4}

event: step_complete
data: {"step": 1, "name": "brand_strategy", "duration_ms": 3842, "preview": {"archetype": "The Warrior", "positioning_preview": "For the Indian athlete who..."}}

event: step_start
data: {"step": 2, "name": "naming_identity", "estimated_seconds": 5}

event: step_complete
data: {"step": 2, "name": "naming_identity", "duration_ms": 4923, "preview": {"selected_name": "VAYU", "tagline": "Move like breath."}}

event: step_start
data: {"step": 3, "name": "visual_direction", "estimated_seconds": 6}

event: image_generating
data: {"step": 4, "concept": "A", "status": "queued"}

event: image_ready
data: {"step": 4, "concept": "A", "image_url": "/api/v2/brands/gen_abc123/logo/A"}

event: quality_gate
data: {"total": 79, "passed": true, "scores": {...}}

event: complete
data: {"generation_id": "gen_abc123", "manual_url": "/api/v2/brands/gen_abc123/manual", "duration_total_ms": 52341}
```

**React SSE handler:**
```typescript
const source = new EventSource(`/api/v2/brands/${genId}/stream`);

source.addEventListener('step_complete', (e) => {
  const data = JSON.parse(e.data);
  dispatch(updateStep(data));
});

source.addEventListener('image_ready', (e) => {
  const data = JSON.parse(e.data);
  dispatch(addLogoPreview(data));
});

source.addEventListener('complete', (e) => {
  source.close();
  dispatch(setComplete(JSON.parse(e.data)));
});
```

### Go Pipeline Orchestrator

```go
// pipeline/orchestrator.go

type Pipeline struct {
    gemini   *gemini.Client
    openai   *openai.Client
    db       *sqlite.DB
    eventBus chan PipelineEvent
}

type PipelineEvent struct {
    Type    string      `json:"type"`
    Step    int         `json:"step"`
    Data    interface{} `json:"data"`
}

func (p *Pipeline) Run(ctx context.Context, input UserInput, genID string) error {
    emit := func(eventType string, step int, data interface{}) {
        p.eventBus <- PipelineEvent{Type: eventType, Step: step, Data: data}
    }
    
    // Step 1: Brand Strategy
    emit("step_start", 1, map[string]interface{}{"name": "brand_strategy", "estimated_seconds": 4})
    strategy, err := p.runBrandStrategy(ctx, input)
    if err != nil {
        return p.handleStepError(ctx, 1, err, genID)
    }
    p.saveStep(genID, 1, strategy)
    emit("step_complete", 1, strategy.Preview())
    
    // Step 2: Naming
    emit("step_start", 2, map[string]interface{}{"name": "naming_identity", "estimated_seconds": 5})
    verbal, err := p.runNaming(ctx, input, strategy)
    if err != nil {
        return p.handleStepError(ctx, 2, err, genID)
    }
    p.saveStep(genID, 2, verbal)
    emit("step_complete", 2, verbal.Preview())
    
    // Step 3: Visual Direction
    emit("step_start", 3, map[string]interface{}{"name": "visual_direction", "estimated_seconds": 6})
    visual, err := p.runVisualDirection(ctx, strategy, verbal)
    if err != nil {
        return p.handleStepError(ctx, 3, err, genID)
    }
    p.saveStep(genID, 3, visual)
    emit("step_complete", 3, visual.Preview())
    
    // Step 4: Logo Concepts (parallel DALL-E calls)
    emit("step_start", 4, map[string]interface{}{"name": "logo_concepts", "estimated_seconds": 20})
    logos, err := p.runLogoGeneration(ctx, strategy, verbal, visual, emit)
    if err != nil {
        return p.handleStepError(ctx, 4, err, genID)
    }
    p.saveStep(genID, 4, logos)
    
    // Step 5: System Integration
    emit("step_start", 5, map[string]interface{}{"name": "system_integration", "estimated_seconds": 8})
    system, err := p.runSystemIntegration(ctx, strategy, verbal, visual, logos)
    if err != nil {
        return p.handleStepError(ctx, 5, err, genID)
    }
    p.saveStep(genID, 5, system)
    
    // Step 6: Quality Gate
    emit("step_start", 6, map[string]interface{}{"name": "quality_gate", "estimated_seconds": 5})
    score, err := p.runQualityGate(ctx, strategy, verbal, visual, logos, system)
    if err != nil {
        return p.handleStepError(ctx, 6, err, genID)
    }
    emit("quality_gate", 6, score)
    
    // Regeneration if needed
    if !score.Passed && score.RegenerationNeeded {
        if err := p.runRegeneration(ctx, genID, score, input, &strategy, &verbal, &visual, &logos, &system); err != nil {
            // Graceful degradation: return what we have even if regen failed
            log.Printf("regeneration failed: %v, returning original", err)
        }
    }
    
    // Compile manual
    manual, err := p.compileManual(strategy, verbal, visual, logos, system, score)
    if err != nil {
        return fmt.Errorf("manual compilation failed: %w", err)
    }
    p.saveManual(genID, manual)
    
    emit("complete", 0, map[string]interface{}{
        "generation_id": genID,
        "manual_url": fmt.Sprintf("/api/v2/brands/%s/manual", genID),
    })
    
    return nil
}
```

### Parallel Logo Generation

```go
func (p *Pipeline) runLogoGeneration(ctx context.Context, ..., emit func(...)) (LogoSystem, error) {
    // First, get conceptual briefs from Gemini
    briefs, err := p.generateLogoBriefs(ctx, strategy, verbal, visual)
    if err != nil {
        return LogoSystem{}, err
    }
    
    // Then render in parallel via DALL-E 3
    type result struct {
        conceptID string
        imageURL  string
        err       error
    }
    
    results := make(chan result, len(briefs))
    
    for _, brief := range briefs {
        go func(b LogoBrief) {
            emit("image_generating", 4, map[string]interface{}{"concept": b.ConceptID})
            
            url, err := p.openai.GenerateImage(ctx, openai.ImageRequest{
                Model:          "dall-e-3",
                Prompt:         b.DallePrompt,
                N:              1,
                Size:           "1024x1024",
                Quality:        "hd",
                Style:          "natural",
                ResponseFormat: "url",
            })
            
            results <- result{conceptID: b.ConceptID, imageURL: url, err: err}
            
            if err == nil {
                emit("image_ready", 4, map[string]interface{}{
                    "concept": b.ConceptID,
                    "image_url": fmt.Sprintf("/api/v2/brands/%s/logo/%s", genID, b.ConceptID),
                })
            }
        }(brief)
    }
    
    // Collect results
    logoImages := make(map[string]string)
    for i := 0; i < len(briefs); i++ {
        r := <-results
        if r.err != nil {
            log.Printf("logo generation failed for concept %s: %v", r.conceptID, r.err)
            // Graceful degradation: continue without this logo
        } else {
            logoImages[r.conceptID] = r.imageURL
        }
    }
    
    // Vectorize and assemble
    return p.assembleLogo(ctx, briefs, logoImages, verbal.SelectedName, visual)
}
```

### Caching Strategy

The caching system uses a content-addressed cache keyed on the hash of inputs consumed by each step. If a user tweaks only the style direction, steps 1-4 are unchanged and can be served from cache.

**Cache key construction:**
```go
type CacheKey struct {
    StepNumber int
    InputHash  string  // SHA256 of all inputs consumed by this step
}

func stepCacheKey(step int, inputs ...interface{}) string {
    h := sha256.New()
    for _, input := range inputs {
        json.NewEncoder(h).Encode(input)
    }
    return fmt.Sprintf("step_%d_%x", step, h.Sum(nil))
}

// Step 1 cache key: hash of user inputs only
step1Key := stepCacheKey(1, userInput)

// Step 2 cache key: hash of user inputs + step 1 output
step2Key := stepCacheKey(2, userInput, strategy)

// Step 3 cache key: hash of strategy + verbal identity
step3Key := stepCacheKey(3, strategy, verbal)
```

**SQLite cache table:**
```sql
CREATE TABLE step_cache (
    cache_key TEXT PRIMARY KEY,
    step_number INTEGER NOT NULL,
    output_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_cache_step ON step_cache(step_number);
```

Cache TTL: 7 days for strategy/naming/visual steps. 3 days for logo steps (DALL-E outputs can drift). Quality gate is never cached.

**Estimated cache hit rate after 1000 generations:** ~30% (many users will share similar category/geography combinations, and tweaking inputs is common)

### Error Handling & Graceful Degradation

```go
type StepError struct {
    Step    int
    Err     error
    Retried bool
}

func (p *Pipeline) handleStepError(ctx context.Context, step int, err error, genID string) error {
    log.Printf("step %d failed: %v", step, err)
    
    // Classify error
    switch {
    case isRateLimitError(err):
        // Wait and retry once
        time.Sleep(10 * time.Second)
        return fmt.Errorf("step %d rate limited, retry scheduled", step)
        
    case isAPIError(err):
        // Try fallback model or reduced prompt
        return p.runStepWithFallback(ctx, step, genID)
        
    case step <= 3:
        // Strategy/naming/visual are critical — fail the whole generation
        return fmt.Errorf("critical step %d failed: %w", step, err)
        
    case step == 4:
        // Logo generation: fail gracefully, return text-based wordmark only
        log.Printf("logo generation failed, falling back to wordmark-only")
        return nil // Continue pipeline with degraded logo system
        
    case step == 5:
        // Integration: skip and compile what we have
        return nil
        
    case step == 6:
        // Quality gate: if it fails, ship anyway with a warning flag
        p.setQualityGateSkipped(genID)
        return nil
    }
    
    return err
}
```

### Rate Limiting Strategy

```go
// Per-user rate limits
var rateLimits = map[string]rate.Limit{
    "free":    rate.Every(24 * time.Hour),  // 1 generation per day
    "starter": rate.Every(4 * time.Hour),   // 6 per day
    "pro":     rate.Every(30 * time.Minute), // 48 per day
}

// Global API rate limits (to stay within provider limits)
var apiLimits = struct {
    gemini rate.Limiter  // 60 RPM on Flash
    openai rate.Limiter  // 5 HD images per minute on DALL-E 3
}{
    gemini: rate.NewLimiter(rate.Every(time.Second), 1), // 1 RPS conservative
    openai: rate.NewLimiter(rate.Every(12*time.Second), 1), // 5 RPM
}
```

---

## 7. Quality Benchmarks & Scoring

### What "Nike/Apple League" Means Concretely

This is not a vibe. It's a measurable standard. Here's what separates icon-level brand work:

| Dimension | Generic Brand | Nike/Apple League |
|---|---|---|
| Name | Descriptive or safe | Meaning that compounds over time |
| Logo | Looks like it was designed | Has become a universal symbol |
| Color | Industry-standard | Owns a color (Tiffany blue, Hermès orange) |
| Voice | Describes features | Declares a worldview |
| Positioning | Competes on attribute | Creates a category |
| Coherence | Parts feel designed | System feels inevitable |
| Cultural weight | Visible in its niche | Referenced beyond its category |

**The test:** Could this brand appear in a design monograph? Would a design student study it? Would a competitor feel threatened by it?

### Scoring Rubric

**Total score ≥ 70 = passes quality gate and ships to user**

| # | Dimension | 9-10 | 7-8 | 5-6 | 3-4 | 1-2 |
|---|---|---|---|---|---|---|
| 1 | Uniqueness | Unmistakable, could only be this brand | Distinct within category | Differentiated but similar to competitors | Generic for category | Indistinguishable from competitors |
| 2 | Coherence | Every element feels inevitable | Strong through-line with minor inconsistencies | Mostly coherent, some arbitrary choices | Parts feel designed by different teams | No coherent identity |
| 3 | Memorability | Sticks after single encounter | Remembered after multiple exposures | Familiar after repeated exposure | Forgettable | Invisible |
| 4 | Strategic Clarity | Specific, falsifiable, defensible position | Clear position with some vagueness | Position exists but is contested | Vague differentiation | No clear differentiation |
| 5 | Naming Quality | Name is distinctive and meaningful | Good name, one dimension strong | Acceptable, no obvious flaws | Generic or awkward | Weak, hard to remember/spell |
| 6 | Visual Distinction | Visual system has unmistakable POV | Strong visual identity, some conventions | Professional but conventional | Generic professional design | Amateur or derivative |
| 7 | Logo Strength | Mark works standalone at any size | Strong mark, some context dependency | Recognizable with context | Needs wordmark always | Forgettable mark |
| 8 | Voice Authenticity | Sounds like a real entity with beliefs | Clear voice, occasional formality | Voice present but sometimes template-ish | Generic brand voice | No distinctive voice |
| 9 | Cultural Sensitivity | Culturally fluent and respectful | No obvious issues | Minor potential ambiguities | Some cultural mismatch | Inappropriate or appropriative |
| 10 | Scalability | System scales across all surfaces | Scales well, minor adaptations needed | Works for primary applications | Breaks at small/large scales | Only works in one context |

### Ideal Output Examples

#### Example A — Artisanal Indian Coffee Brand

**Brand name:** NAGARIK ("citizen" in Sanskrit — the everyday ritual of great coffee as civic participation)  
**Tagline:** "Every city has a cup."

**Strategy:** Positions between Blue Bottle (aspirational, expensive, Western) and local filter coffee (nostalgic, low quality). Whitespace: no brand currently dignifies the *ordinary Indian morning* as a quality ritual.  
**Visual:** Earth tones — burnt ochre, cool grey, aged white. Typeface pairing: Playfair Display (the heritage of coffee culture) + IBM Plex Mono (the precision of extraction).  
**Logo mark:** A single cup viewed from above — the circle of the mouth becomes a clock face. Every cup is a moment.  
**Quality score:** 83/100 — passes comfortably.

#### Example B — B2B Logistics Tech Platform

**Brand name:** PATHA ("path" in Sanskrit, also "route" — precise, direct, no ambiguity)  
**Tagline:** "The shortest line between here and delivered."

**Strategy:** In a category of generic logistics SaaS brands (blue, arrows, speed lines), PATHA positions on clarity: not fastest, not cheapest — *most predictable*. Whitespace: every competitor promises speed; none promises certainty.  
**Visual:** Industrial palette — raw concrete grey + signal amber. Typeface: Aktiv Grotesk + Source Code Pro (data tables, tracking numbers). No lifestyle photography. Infrastructure photography only: warehouses, highways, loading docks.  
**Logo mark:** A precise dot at the end of a path — not an arrow (which implies direction) but a terminal point (which implies arrival).  
**Quality score:** 76/100 — passes.

#### Example C — Performance Nutrition Brand

**Brand name:** SATWA ("essence" in Sanskrit, also connotes purity and fundamental nature)  
**Tagline:** "Back to base."

**Strategy:** Against the noise of supplement marketing (extreme sports, neon, superlative claims), SATWA positions as the anti-supplement supplement: no claims, just ingredients. Whitespace: Indian athletes who are skeptical of Western supplement marketing but have no credible Indian alternative.  
**Visual:** Laboratory minimalism — pure white, muted forest green, pharmaceutical typography. Typeface: Helvetica Neue + Garamond (the tension between clinical precision and natural origin).  
**Logo mark:** A single grain — the Platonic form of a seed, rendered as a geometric reduction.  
**Quality score:** 81/100 — passes.

---

## 8. Implementation Phases

### Phase 1 — Ship in 1 Week

**Goal:** Working multi-step pipeline that produces noticeably better output than v1.

**Scope:**
- [ ] Steps 1-3 in sequence (Strategy, Naming, Visual Direction)
- [ ] SSE stream endpoint with step progress events
- [ ] Basic quality gate (run but don't gate — just score and show)
- [ ] Brand manual with updated HTML template using actual step data
- [ ] No logo changes (keep v1 SVG templates for now)
- [ ] No caching yet
- [ ] React frontend: progress UI with step-by-step preview reveal

**What this delivers:**
- Strategy, naming, and visual sections are dramatically improved
- Users see generation progress in real time
- Brand story and voice sections feel authored, not template-filled
- Quality scores visible to user

**What it doesn't deliver:**
- DALL-E logo generation
- Vectorization
- Caching
- Regeneration on quality gate fail

**Estimated effort:** 4-5 days engineering

---

### Phase 2 — 2-3 Weeks

**Goal:** Full pipeline including real logo generation and caching.

**Scope:**
- [ ] DALL-E 3 logo generation (Steps 4-5)
- [ ] Potrace vectorization pipeline
- [ ] SVG wordmark rendering
- [ ] Logo system assembly (combined marks, monogram)
- [ ] Quality gate gating (hold brand if score < 70)
- [ ] Regeneration logic (re-run weak steps)
- [ ] Caching layer (SQLite, SHA256 keyed)
- [ ] Brand manual sections 4-7 (logo system, applications, guidelines)
- [ ] Logo selection UI (user picks from 3 concepts)
- [ ] PDF export via headless Chromium

**What this delivers:**
- Real, unique logos for every brand
- Brands don't show until they pass quality threshold
- Repeat users get faster generation on similar inputs
- Professional PDF output ready for client delivery

**Estimated effort:** 10-12 days engineering

---

### Phase 3 — Full Vision (1-2 Months)

**Goal:** The tool that could replace a $10K brand engagement for early-stage brands.

**Scope:**
- [ ] User iteration: ability to re-run individual steps with feedback
- [ ] Name preference: user picks from 5 candidates, rest of pipeline uses selection
- [ ] Color customization: user can override one color with reasoning preserved
- [ ] Mockup rendering: actual visual mockups (not descriptions) using brand colors/typography
- [ ] Trademark search API integration (USPTO, Indian trademark registry)
- [ ] Domain availability check integration
- [ ] Brand comparison: "how different is this from [competitor]?"
- [ ] Export formats: PDF, Figma file (via Figma API), brand asset ZIP
- [ ] Generation history and versioning
- [ ] Collaboration: share a generation link with team
- [ ] Iteration on quality gate failures: show user what was weak and why

**Stretch goals:**
- [ ] Brand evolution module: update brand as company grows
- [ ] Sub-brand generation: create product lines within existing brand system
- [ ] Competitive intelligence: automated analysis of category visual landscape
- [ ] A/B testing for messaging: generate 2 voice variants, track preference

**Estimated effort:** 6-8 weeks engineering

---

## 9. Cost Model

### Per-Generation Cost Estimate

| Component | Model | Tokens/Calls | Cost |
|---|---|---|---|
| Step 1: Strategy | Gemini 2.5 Flash | 5K tokens | $0.003 |
| Step 2: Naming | Gemini 2.5 Flash | 7K tokens | $0.004 |
| Step 3: Visual | Gemini 2.5 Flash | 9K tokens | $0.005 |
| Step 4: Logo briefs | Gemini 2.5 Flash | 8K tokens | $0.005 |
| Step 4: DALL-E 3 HD | dall-e-3 | 3× 1024px HD | $0.24 |
| Step 5: Integration | Gemini 2.5 Flash | 13K tokens | $0.008 |
| Step 6: Quality gate | Gemini 2.5 Flash | 11K tokens | $0.007 |
| Vectorization | Potrace (local) | — | $0.000 |
| **Total per generation** | | | **~$0.27** |

**With regeneration (20% of generations):** add ~$0.10 → average $0.29/generation

**At $15/month pro tier:** 51 generations/user/month before Gemini/OpenAI costs exceed revenue. Given actual usage patterns (3-5 generations/user/month), margin is healthy.

**Phase 1 cost (no DALL-E):** ~$0.03/generation — essentially free at current scale.

---

## 10. Data Structures (Go)

```go
// models/generation.go

type UserInput struct {
    Essence           string   `json:"essence"`
    ProductVessel     string   `json:"product_vessel"`
    Theme             string   `json:"theme"`
    StyleDirection    string   `json:"style_direction"`
    TargetDescription string   `json:"target_description"`
    Category          string   `json:"category"`
    Geography         string   `json:"geography"`
    Languages         []string `json:"languages"`
}

type Generation struct {
    ID          string          `json:"id"`
    UserID      string          `json:"user_id"`
    Input       UserInput       `json:"input"`
    Status      GenerationStatus `json:"status"`
    Steps       map[int]StepResult `json:"steps"`
    QualityScore *QualityScore  `json:"quality_score,omitempty"`
    ManualHTML  string          `json:"manual_html,omitempty"`
    CreatedAt   time.Time       `json:"created_at"`
    CompletedAt *time.Time      `json:"completed_at,omitempty"`
    DurationMs  int64           `json:"duration_ms,omitempty"`
}

type GenerationStatus string
const (
    StatusPending    GenerationStatus = "pending"
    StatusRunning    GenerationStatus = "running"
    StatusComplete   GenerationStatus = "complete"
    StatusFailed     GenerationStatus = "failed"
    StatusDegraded   GenerationStatus = "degraded" // completed but with failures
)

type StepResult struct {
    StepNumber  int         `json:"step_number"`
    Name        string      `json:"name"`
    Output      interface{} `json:"output"` // typed per step
    DurationMs  int64       `json:"duration_ms"`
    CacheHit    bool        `json:"cache_hit"`
    Error       string      `json:"error,omitempty"`
}

type StrategyFoundation struct {
    Archetype           string              `json:"archetype"`
    ArchetypeReasoning  string              `json:"archetype_reasoning"`
    PositioningStatement string             `json:"positioning_statement"`
    CompetitiveWhitespace string            `json:"competitive_whitespace"`
    TargetPsychographics TargetPsychographics `json:"target_psychographics"`
    BrandTensions       []string            `json:"brand_tensions"`
    StrategicPillars    []Pillar            `json:"strategic_pillars"`
    CompetitiveLandscape CompetitiveLandscape `json:"competitive_landscape"`
    BrandPromise        string              `json:"brand_promise"`
    CulturalContext     string              `json:"cultural_context"`
}

type VerbalIdentity struct {
    NameCandidates    []NameCandidate `json:"name_candidates"`
    SelectedName      string          `json:"selected_name"`
    SelectionRationale string         `json:"selection_rationale"`
    Tagline           string          `json:"tagline"`
    TaglineRationale  string          `json:"tagline_rationale"`
    AltTaglines       []string        `json:"alternative_taglines"`
    BrandVoice        BrandVoice      `json:"brand_voice"`
    MessagingPillars  []MessagingPillar `json:"messaging_pillars"`
    NamingStory       string          `json:"naming_story"`
}

type VisualSystem struct {
    ColorSystem       ColorSystem       `json:"color_system"`
    Typography        Typography        `json:"typography"`
    SpatialPrinciples SpatialPrinciples `json:"spatial_principles"`
    TextureDirection  TextureDirection  `json:"texture_direction"`
    Photography       PhotographyDirection `json:"photography_direction"`
    Iconography       IconographySystem `json:"iconography"`
    VisualKeywords    []string          `json:"visual_keywords"`
    VisualAntiKeywords []string         `json:"visual_anti_keywords"`
    MoodboardDescription string         `json:"moodboard_description"`
}

type LogoSystem struct {
    Concepts          []LogoConcept    `json:"concepts"`
    SelectedConcept   string           `json:"selected_concept"`
    SelectionRationale string          `json:"selection_rationale"`
    MarkVariations    MarkVariations   `json:"mark_variations"`
    ClearSpace        string           `json:"clear_space"`
    MinimumSize       MinimumSize      `json:"minimum_size"`
    ColorVariants     []string         `json:"color_variants"`
    IncorrectUsage    []string         `json:"incorrect_usage"`
}

type LogoConcept struct {
    ConceptID          string `json:"concept_id"`
    ConceptName        string `json:"concept_name"`
    MarkPhilosophy     string `json:"mark_philosophy"`
    GeometricDescription string `json:"geometric_description"`
    NegativeSpaceIdea  string `json:"negative_space_idea"`
    DallePrompt        string `json:"dalle_prompt"`
    ImageURL           string `json:"image_url,omitempty"`
    ImageSVG           string `json:"image_svg,omitempty"` // after vectorization
}

type MarkVariations struct {
    Symbol             string `json:"symbol"`            // SVG
    Wordmark           string `json:"wordmark"`          // SVG
    CombinedHorizontal string `json:"combined_horizontal"` // SVG
    CombinedStacked    string `json:"combined_stacked"`  // SVG
    Monogram           string `json:"monogram"`          // SVG
}

type QualityScore struct {
    Scores             map[string]int `json:"scores"`
    Total              int            `json:"total"`
    Passed             bool           `json:"passed"`
    WeakSteps          []string       `json:"weak_steps"`
    Critique           ScoreCritique  `json:"critique"`
    RegenerationNeeded bool           `json:"regeneration_needed"`
    CriticalFailure    string         `json:"critical_failure,omitempty"`
    RegenerationCount  int            `json:"regeneration_count"`
}

// SQLite schema
const schema = `
CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    input_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    steps_json TEXT,
    quality_score_json TEXT,
    manual_html TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS brand_assets (
    id TEXT PRIMARY KEY,
    generation_id TEXT NOT NULL REFERENCES generations(id),
    asset_type TEXT NOT NULL, -- 'logo_concept_A', 'logo_svg', 'manual_pdf', etc.
    content_type TEXT NOT NULL, -- 'image/png', 'image/svg+xml', 'application/pdf'
    data BLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS step_cache (
    cache_key TEXT PRIMARY KEY,
    step_number INTEGER NOT NULL,
    output_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_generation ON brand_assets(generation_id);
CREATE INDEX IF NOT EXISTS idx_cache_step ON step_cache(step_number);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON step_cache(expires_at);
`
```

---

## Appendix: Open Questions for Nithin

1. **Logo selection UX:** Should the user always pick from 3 concepts, or can we auto-select the highest-rated one and let the user override? Auto-selection is faster; manual selection is more empowering.

2. **Name selection:** Same question — auto-pick vs. user chooses from 5 candidates. My recommendation: show all 5, let user pick. Name is too personal to automate.

3. **Regeneration visibility:** When the quality gate fails and we re-run, should the user see this happening? Or do we run it silently and only show the final result? My recommendation: hide it (show "polishing your brand identity...") — showing failure feels bad even if it resolves.

4. **Pricing alignment with cost:** At ~$0.27/generation, free tier needs to be limited. Suggested: 2 free generations (enough to experience the product), then require account with paid tier for more.

5. **DALL-E image ownership:** OpenAI grants full ownership of DALL-E 3 outputs for commercial use. Verified. We can include logos in deliverables without licensing issues.

6. **Potrace dependency:** Potrace is a GPL-2.0 library. For a SaaS deployment, we call it as a subprocess (not linked), which avoids the GPL propagation issue. Worth a legal sanity check before shipping.

7. **Streaming vs. polling fallback:** Some corporate networks and proxies block SSE. We should implement a polling fallback (`GET /api/v2/brands/:id/status`) for SSE-hostile environments.

---

*This spec is the blueprint. Every architectural decision has a reason. If anything here is wrong or doesn't fit the direction, I'd rather know now than after we build it. — Ram 🏹*

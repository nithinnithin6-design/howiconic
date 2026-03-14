# HowIconic v2 — Complete Change Brief for Google AI Studio

## Context
HowIconic is an AI-powered brand identity engine. It takes user inputs about a brand idea and generates a complete brand identity system — name, strategy, colors, typography, voice, and a brand manual.

**Current stack:** Go backend, React + Vite frontend, Gemini 2.5 Flash API, SQLite, JWT auth.

**Current state:** Single Gemini API call generates everything at once. Output feels like a template fill, not agency-quality work. SVG logo templates (15 parameterized shapes with letters). UI terminology is confusing.

**Goal:** Transform it into something that produces output on par with Pentagram, Collins, or Wolff Olins case studies. Every brand that comes out should feel like a $50K agency delivered it.

---

## BACKEND CHANGES

### 1. Multi-Step Generation Pipeline
Replace the single Gemini API call with a 4-step sequential chain. Each step receives ALL previous step outputs as context, so each decision builds on the last (just like a real agency process).

**Step 1 — Brand Strategy**
- Input: User's brand essence, product description, target audience, category
- Output: Brand archetype (with reasoning), positioning statement, competitive whitespace analysis, target psychographics (primary + secondary + anti-audience), brand tensions, strategic pillars, brand promise, cultural context
- Prompt tone: McKinsey brand strategist — analytical, specific, no fluff

**Step 2 — Naming & Verbal Identity**
- Input: Step 1 output + user inputs
- Output: 5 name candidates each with linguistic analysis (etymology, phonetics, cultural valence, memorability score, domain availability), selected name with rationale, tagline + alternatives, brand voice definition (tone, vocabulary, anti-vocabulary, sentence rhythm, example copy), messaging pillars with proof points
- Prompt tone: Lexicon Branding naming session — every name is defended with reasoning

**Step 3 — Visual Direction**
- Input: Steps 1-2 output
- Output: Complete color system where EVERY color has a name, hex, AND a paragraph explaining WHY (psychological effect, cultural reference, usage rules). Typography with rationale (why this pairing, what tension it creates). Spatial principles (grid, whitespace philosophy). Texture direction. Photography style. Iconography rules. Visual keywords and anti-keywords.
- Prompt tone: Pentagram design director — colors aren't "blue because trust," they're "Midnight Teal #1B3A4B because it references the depth of ocean shipping routes, grounding a logistics brand in its physical reality"

**Step 4 — Brand System Integration**
- Input: Steps 1-3 output
- Output: Cohesive brand system that ties everything together. Brand story narrative. Application descriptions (packaging, website, social, signage). Do's and don'ts. Brand guidelines summary. Mockup descriptions.
- Prompt tone: Creative director presenting final work — confident, cohesive, every element justified

### 2. SSE Streaming Endpoint
New endpoint: `/api/generate/brand/stream`
- Sends Server-Sent Events as each step completes
- Events: `{"step": 1, "status": "started", "label": "Crafting brand strategy..."}`
- Then: `{"step": 1, "status": "complete", "data": {...step 1 output...}}`
- Frontend shows real-time progress

### 3. Keep Backward Compatibility
- Old `/api/generate/brand` endpoint still works (runs all steps sequentially, returns combined result)
- Existing BrandSystem type extended, not replaced
- Auth, JWT, database — nothing changes

---

## FRONTEND CHANGES

### 4. Input Form Redesign (EngineView.tsx)

**OLD → NEW terminology:**

| OLD | NEW | Placeholder |
|-----|-----|-------------|
| "Inspiration" (textarea) | **"Brand Essence"** | "What should this brand believe? e.g., Movement is medicine" |
| "Product Vessel" (textarea) | **"What are you building?"** | "e.g., Premium compression activewear for Indian athletes" |
| Theme selector (Sensory/Tactile/Industrial/etc) | **"Brand World"** | Options: Performance, Luxury, Craft, Technology, Culture, Wellness |
| Style selector (Modern Minimalist/Geometric/etc) | **"Visual DNA"** | Options: Clean & Sharp, Bold & Raw, Refined & Classic, Future-Forward |
| Fidelity slider | **REMOVED** (or renamed to Complexity with Low/High) | — |
| — (new) | **"Who is this for?"** | "e.g., Urban Indian athletes, 25-35, who train seriously" |
| — (new) | **"Category"** | "e.g., Activewear, Fintech, Coffee, Fashion, SaaS" |

**Layout:**
- Primary fields first: Brand Essence + What are you building (these are required)
- "Refine your brief" collapsible section: Brand World, Visual DNA, Who is this for, Category (optional but improve output quality)
- 1-line instruction at top: "Describe your vision. We'll build your brand system."
- MANIFEST button stays (it's good)

### 5. Loading/Progress State

When user clicks MANIFEST, show a full-screen dark overlay with:
```
→ Crafting brand strategy...          ✓
→ Developing name & voice...          ✓  
→ Designing visual system...          (spinning)
→ Integrating brand identity...       (waiting)
```

Each step shows a checkmark when complete. Subtle animation. The user watches their brand being built in real-time.

### 6. Brand Manual Redesign (BrandManual.tsx)

The output should scroll like a **Pentagram case study**, not a data dump.

**Section order:**

1. **Cover** — Brand name in massive type (Playfair Display, 80-120px). Tagline below. Background in the brand's primary color. Clean, dramatic.

2. **Brand Story** — Full narrative paragraph (from Step 4). Large pull quote. This is the emotional hook.

3. **Strategy Foundation** — Archetype with reasoning. Positioning statement. Target audience psychographics. Brand tensions. Strategic pillars. Presented as narrative blocks with headers, not a bulleted list.

4. **Naming Rationale** — Why this name was chosen. Etymology. Phonetic qualities. The 5 candidates that were considered (show all 5 with scores, highlight the winner). This shows the depth of thinking.

5. **Color System** — Each color gets its own block:
   - Large color swatch
   - Color name (not just "Primary" — a real name like "Iron Dusk" or "Compression Orange")
   - Hex + RGB
   - 2-3 sentence explanation of WHY this color (psychological effect, cultural reference, what it communicates)
   - Usage rules

6. **Typography** — Primary + secondary typeface with rationale for the pairing. Type scale. Example text rendered in the actual fonts. Rules (when to use all-caps, tracking, etc.)

7. **Voice & Tone** — Tone description. Vocabulary and anti-vocabulary. Example copy. Messaging pillars. Sentence rhythm.

8. **Applications** — Descriptions of how the brand lives in context: packaging, website, social media, signage. (Text descriptions for now, mockup images in Phase 2.)

9. **Guidelines** — Do's and don'ts. Clear space rules for logo. Color usage rules.

**Design principles for the manual:**
- Generous whitespace (the brand should breathe)
- Large type for key statements, smaller body text for explanations
- Dark background (#0a0a0a) with brand colors as accents
- Section dividers with subtle lines or brand pattern
- Pull quotes and highlighted stats
- Feels like opening a physical brand book, not scrolling a webpage

### 7. Sacred Design Tokens (DO NOT CHANGE)
- Background: #0a0a0a
- Accent: #f17022 (HowIconic's own brand color, NOT the generated brand's color)
- Fonts: Playfair Display (headings) + Bodoni Moda + Inter (body)
- Blueprint grid background on the engine page
- MANIFEST as CTA text
- Magnetic button hover effects
- Sound design: click on interactions, whoosh on transitions, chime on generation complete
- `prefers-reduced-motion` support
- Mobile-first responsive

---

## QUALITY STANDARD

The test: show the generated brand manual to a design director. If they can't tell it was AI-generated, we've succeeded. If it looks like "AI output," we've failed.

**Benchmark sites for comparison:**
- Stripe.com (clarity, whitespace, confidence)
- Linear.app (dark theme, precision, developer-elegant)
- Pentagram.com case studies (depth of thinking, narrative quality)
- Collins (visual impact, bold typography)
- Vercel.com (clean, modern, fast-feeling)

**What makes it world-class:**
1. Every color has a REASON, not just a hex code
2. Every name has ETYMOLOGY and ANALYSIS, not just a word
3. Every typography choice has a RATIONALE, not just a font name
4. The strategy reads like it came from a human strategist
5. The brand story reads like it came from a human copywriter
6. The manual LOOKS like a $50K deliverable
7. The loading experience makes you WANT to wait (it's that satisfying to watch)

---

## WHAT'S NOT CHANGING (Phase 2/3)
- Logo generation (still using SVG templates for now — DALL-E integration is Phase 2)
- PDF export (Phase 2)
- Quality gate / AI self-review (Phase 2)
- Brand iteration / refinement flow (Phase 3)
- Payment / subscription (Phase 3)

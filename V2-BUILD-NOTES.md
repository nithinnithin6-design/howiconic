# HowIconic v2 Phase 1 — Build Notes
**Date:** 2026-03-13
**Status:** ✅ DEPLOYED & VERIFIED

## What Was Built

### Backend: 4-Step Gemini Pipeline
**File:** `server/generate.go`

- **Step 1: Brand Strategy** — McKinsey-level brand strategist prompt producing archetype, positioning, competitive whitespace, target psychographics, strategic pillars, cultural context, brand promise
- **Step 2: Naming & Verbal Identity** — Lexicon Branding-style naming director prompt generating 5 name candidates (5 strategies: coined, descriptive, evocative, experiential, borrowed), selecting the best, plus tagline, brand voice, messaging pillars, naming story
- **Step 3: Visual Direction** — Color theory with WHY (psychological/cultural/competitive reasoning), typography rationale, spatial principles, moodboard direction. Each color gets 60-80 word theory
- **Step 5: Brand System Integration** — 450+ word brand narrative in brand voice, system coherence notes (why every element fits), 5 application scenarios, 8 dos/8 don'ts, evolution notes

**Key architectural principle:** Each step receives ALL previous step outputs as context. Step 3 receives Strategy + Verbal JSON. Step 5 receives all three.

**New endpoints:**
- `POST /api/generate/brand/stream` — SSE streaming, sends step_start/step_complete/complete/error events
- `POST /api/generate/brand` — upgraded to use same 4-step pipeline, non-streaming

**Technical fixes applied:**
- `maxOutputTokens: 16384` to avoid truncation
- `removeTrailingCommas()` function for Gemini's occasional invalid JSON
- `parseGeminiJSON()` with 3-tier fallback: standard unmarshal → json.Decoder → brace-matching
- SSE keepalive ping every 20s (GCP Load Balancer has 30s default timeout)
- Graceful degradation on Step 5 failure (still returns brand from Steps 1-3)
- Gemini 2.5 Flash thinking-part detection (skips `thought: true` parts)

### Frontend

**EngineView.tsx** — Full redesign:
- "Brand Essence" field (was "Inspiration")
- "What Are You Building?" field (was "Product Vessel")
- "Brand World" labels: Performance, Luxury, Craft, Technology, Culture, Wellness (was sensory/tactile themes)
- "Visual DNA" labels: Clean & Sharp, Bold & Raw, Refined & Classic, Future-Forward (was geometric styles)
- Collapsible "Refine" section with "Who Is It For?" and "Category" fields (new — feed into strategy)
- Headline: "Describe your vision. We'll build your brand."
- Manifest CTA with "~30-45 seconds · 4-step AI pipeline" hint

**App.tsx** — SSE integration:
- `GenerationProgress` component: 4-step progress overlay with bloom animation, ✓ on completion
- `handleManifest` now accepts `targetDescription` and `category` params
- Primary path: SSE streaming via `streamGenerateBrand()`
- Fallback path: non-streaming `generateBrandV2()` if SSE fails
- Demo fallback: client-side data if API unavailable
- `mapBrandResult()` handles both v2 pipeline format and v1/demo format
- `AnimatePresence` wrapping for smooth overlay in/out

**types.ts** — Extended with full v2 types:
- `V2Strategy`, `V2Verbal`, `V2Visual`, `V2Integration` interfaces
- `V2NameCandidate`, `V2BrandVoice`, `V2MessagingPillar`, `V2ApplicationScenario`
- `ColorInfo` extended with `theory?`, `why_not_obvious?`
- `TypographyRole` extended with `rationale?`
- `BrandSystem` extended with optional `v2Strategy?`, `v2Verbal?`, `v2Visual?`, `v2Integration?`

**api.ts** — Added:
- `streamGenerateBrand(input, onEvent)` — POST-based SSE reader
- `generateBrandV2(input)` — non-streaming v2 endpoint call
- `SSEEventCallback` type
- `V2BrandInput` interface

**BrandManual.tsx** — Full Pentagram-style narrative redesign:
- 11 sections with numbered headers (01-11)
- Cover: brand name at clamp(4.5rem, 14vw, 9rem), tagline, UID metadata
- Brand Story: full narrative from Step 5 (400+ words in brand voice)
- Strategy: archetype badge + reasoning, positioning pullquote (large type), competitive whitespace, target psychographics (3 cards), strategic pillars, brand promise
- Naming Rationale: name at clamp(5rem, 16vw, 11rem) in brand primary, etymology, phonetic quality, selection rationale, naming story, alternative candidates
- Color System: full swatch + tints + specs + WHY theory from Step 3 + why_not_obvious
- Typography: typeface specimens + rationale paragraphs + pairing tension explanation
- Voice & Tone: tone pullquote, vocabulary/anti-vocabulary, example copy, messaging pillars
- Applications: 5 scenario cards with context/description/visual_direction
- Guidelines: dos/don'ts numbered lists + evolution notes
- System Coherence: Step 5 authored narrative
- V2 badge when v2 data present; graceful fallback to v1 fields

## Performance
- Full pipeline: ~2 minutes (4 Gemini 2.5 Flash calls)
- SSE streaming shows live step progress
- Logo generation is independent (400 error on template system is expected — unrelated to pipeline)

## Known Gaps
- Step 5 occasionally returns JSON with extra content — handled by json.Decoder fallback
- Pipeline takes ~2 min — longer than the "~30-45 seconds" hint (update the UX hint if needed)
- Logo system not integrated with v2 pipeline (Phase 2 / Step 4 in spec)

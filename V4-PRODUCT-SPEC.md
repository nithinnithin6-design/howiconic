# HowIconic v4 — Complete Product Specification
## Brand Operating System: Full Technical Blueprint

**Version:** 4.0.0  
**Author:** Ram (AI Employee, Essdee)  
**Date:** 2026-03-16  
**Status:** BLUEPRINT — For Development

---

## TABLE OF CONTENTS

1. [Vision & Architecture Overview](#1-vision--architecture-overview)
2. [Data Model (Database Schema)](#2-data-model)
3. [API Endpoints](#3-api-endpoints)
4. [Generation Pipeline (v4)](#4-generation-pipeline-v4)
5. [Screen-by-Screen UX Spec](#5-screen-by-screen-ux-spec)
6. [Education System](#6-education-system)
7. [Design System](#7-design-system)
8. [Tech Stack & Architecture](#8-tech-stack--architecture)
9. [Build Phases](#9-build-phases)
10. [File Structure](#10-file-structure)

---

## 1. VISION & ARCHITECTURE OVERVIEW

### What HowIconic v4 Is

HowIconic v4 is a **Brand Operating System** — not a brand generator. The distinction matters. A generator produces and hands off. An operating system runs continuously. It grows with the company.

The three layers:
- **Architect** — AI-powered brand strategy and identity generation engine
- **Vault** — Brand asset management, version control, sharing, architecture management
- **Studio** — Design production layer (business cards, social posts, packaging, etc.) that auto-pulls from the brand system

### North Star Experience

When someone uses HowIconic for the first time, they should feel like they just hired a $50,000 agency. When they return for the fifth time, it should feel like that agency has learned everything about their company.

The product teaches branding while doing it. Every interaction is an education. Users leave knowing *why* their brand looks the way it does — not just what it looks like.

### Three Users This Is Built For

1. **The Founder** — Has a product, wants a brand. No design background. Needs results fast, needs to understand what they're getting.
2. **The Designer** — Uses this as a starting system, adds their craft on top. Needs version control, export quality, technical precision.
3. **The Brand Manager** — Has multiple brands to manage. Needs architecture view, comparison, sharing with external teams.

---

## 2. DATA MODEL

### Migration Strategy
All new tables are additive. The existing `users` and `brands` tables are preserved. New columns added to `brands` with sensible defaults for backward compatibility. No existing data is lost.

### 2.1 Users Table (EXISTING — preserve as-is)
```sql
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Brands Table (UPDATED — add new columns)
```sql
-- Existing table — add columns via ALTER TABLE in migration
CREATE TABLE IF NOT EXISTS brands (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  name              TEXT,
  tagline           TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Core inputs
  brand_idea        TEXT,       -- "What is this brand about?"
  product           TEXT,       -- "What does it sell/do?"
  audience          TEXT,       -- "Who is it for?"
  vibe              TEXT,       -- Selected vibe token (bold, minimal, warm, etc.)

  -- Generated strategy (stored as JSON)
  strategy          TEXT,       -- JSON: see StrategyJSON type below

  -- Brand architecture
  parent_brand_id   INTEGER REFERENCES brands(id),
  brand_type        TEXT DEFAULT 'standalone',
  -- brand_type values: 'standalone' | 'parent' | 'sub-brand' | 'endorsed'

  -- Classification
  category          TEXT,
  subcategory       TEXT,

  -- Lifecycle
  status            TEXT DEFAULT 'draft',
  -- status values: 'draft' | 'active' | 'archived'

  -- Generation metadata
  generation_model  TEXT,       -- which model version generated this
  generation_time   INTEGER,    -- milliseconds to generate

  -- Soft delete
  deleted_at        DATETIME
);

-- Migration: If table exists without new columns, add them:
-- ALTER TABLE brands ADD COLUMN brand_type TEXT DEFAULT 'standalone';
-- ALTER TABLE brands ADD COLUMN parent_brand_id INTEGER REFERENCES brands(id);
-- ALTER TABLE brands ADD COLUMN strategy TEXT;
-- ALTER TABLE brands ADD COLUMN audience TEXT;
-- ALTER TABLE brands ADD COLUMN vibe TEXT;
-- ALTER TABLE brands ADD COLUMN category TEXT;
-- ALTER TABLE brands ADD COLUMN subcategory TEXT;
-- ALTER TABLE brands ADD COLUMN status TEXT DEFAULT 'draft';
-- ALTER TABLE brands ADD COLUMN deleted_at DATETIME;
-- ALTER TABLE brands ADD COLUMN generation_model TEXT;
-- ALTER TABLE brands ADD COLUMN generation_time INTEGER;
-- ALTER TABLE brands ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

**StrategyJSON type definition (stored in `strategy` column):**
```typescript
interface StrategyJSON {
  positioning: string;           // "The only X that Y for Z"
  values: string[];              // 5 core brand values
  personality: string[];         // 5 personality traits
  promise: string;               // The brand promise (1 sentence)
  competitive_angle: string;     // What makes this different
  target_feeling: string;        // How customers should feel
  archetype: string;             // Brand archetype (Hero, Sage, etc.)
  
  // Generated names
  names: {
    name: string;
    etymology: string;           // Word origin/construction logic
    story: string;               // Why this name for this brand
    domain_available: boolean;   // .com availability check
    domain_alternatives: string[]; // .io, .co, .brand alternatives
  }[];
  
  // Selected/locked name (after user chooses)
  selected_name?: string;
  
  // Visual identity
  visual_identity: {
    colors: {
      primary: { hex: string; name: string; rationale: string };
      secondary: { hex: string; name: string; rationale: string };
      accent: { hex: string; name: string; rationale: string };
      neutral_light: { hex: string; name: string };
      neutral_dark: { hex: string; name: string };
    };
    typography: {
      heading: { family: string; weight: string; rationale: string };
      body: { family: string; weight: string; rationale: string };
      mono?: { family: string; rationale: string };
    };
    logo_direction: string;      // Text description of logo concept
    logo_archetype: string;      // wordmark | lettermark | pictorial | combination | emblem
    logo_svg?: string;           // Generated SVG markup (geometric)
    design_principles: string[]; // 3 visual design principles
  };
  
  // Voice & tone
  voice: {
    description: string;         // Brand voice in 2-3 sentences
    tone_spectrum: string;       // e.g., "Professional but warm, never cold"
    words_to_use: string[];      // 10 words that fit this brand
    words_to_avoid: string[];    // 10 words that clash with this brand
    sample_tagline: string;
    sample_about: string;        // 2-3 sentences
    sample_social: string;       // One social post
    sample_headline: string;     // A website headline
    dos: string[];               // 3 communication DOs
    donts: string[];             // 3 communication DON'Ts
  };
  
  // Brand architecture (for sub-brands)
  architecture_notes?: {
    relationship_type: string;
    visual_connection_rules: string;
    naming_convention: string;
    parent_brand_equity_used: string;
  };
}
```

### 2.3 Brand Assets Table
```sql
CREATE TABLE IF NOT EXISTS brand_assets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id     INTEGER NOT NULL REFERENCES brands(id),
  asset_type   TEXT NOT NULL,
  -- asset_type values:
  -- logo_primary | logo_mark | logo_wordmark | logo_monochrome | logo_reversed
  -- logo_favicon | logo_app_icon
  -- color_palette | typography_specimen
  -- pattern | texture | icon
  -- business_card | letterhead | social_template
  -- brand_guidelines_pdf | brand_kit_zip

  file_path    TEXT,            -- relative path from assets root
  file_url     TEXT,            -- public URL if hosted
  file_format  TEXT,            -- svg | png | pdf | eps | zip | jpg
  file_size    INTEGER,         -- bytes

  version      INTEGER DEFAULT 1,  -- auto-increment per brand+asset_type
  is_current   INTEGER DEFAULT 1,  -- 1 = current version, 0 = historical

  metadata     TEXT,           -- JSON: dimensions, colors, font names, etc.
  -- metadata structure:
  -- { width: number, height: number, colors: string[], fonts: string[],
  --   generated_by: 'ai' | 'user_upload' | 'system',
  --   quality_score?: number, // 0-100 from 7-point check
  --   quality_flags?: string[] }

  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast asset lookup
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON brand_assets(brand_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_current ON brand_assets(brand_id, asset_type, is_current);
```

### 2.4 Brand Architecture Table
```sql
CREATE TABLE IF NOT EXISTS brand_architecture (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_brand_id   INTEGER NOT NULL REFERENCES brands(id),
  child_brand_id    INTEGER NOT NULL REFERENCES brands(id),
  relationship_type TEXT NOT NULL,
  -- values: 'parent' | 'endorsed' | 'sub-brand' | 'sibling'
  position          INTEGER DEFAULT 0,  -- ordering within siblings
  notes             TEXT,               -- optional description of relationship
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(parent_brand_id, child_brand_id)
);

CREATE INDEX IF NOT EXISTS idx_arch_parent ON brand_architecture(parent_brand_id);
CREATE INDEX IF NOT EXISTS idx_arch_child ON brand_architecture(child_brand_id);
```

### 2.5 Design Productions Table (Studio)
```sql
CREATE TABLE IF NOT EXISTS design_productions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id        INTEGER NOT NULL REFERENCES brands(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  production_type TEXT NOT NULL,
  -- values: business_card | letterhead | social_ig | social_linkedin
  --         social_twitter | poster_a4 | poster_a3 | label_standard
  --         packaging_box | email_header | presentation_cover
  --         invoice | envelope | tote_bag

  template_id     TEXT NOT NULL,          -- references template registry
  template_name   TEXT,                   -- human-readable template name
  content         TEXT,                   -- JSON: customized content for this production
  -- content structure varies by type, e.g. for business_card:
  -- { name: string, title: string, email: string, phone: string,
  --   website: string, custom_fields: {label: string, value: string}[] }

  output_path     TEXT,                   -- generated file path
  output_format   TEXT DEFAULT 'pdf',     -- pdf | png | svg
  thumbnail_path  TEXT,                   -- preview thumbnail

  status          TEXT DEFAULT 'pending', -- pending | generating | complete | failed
  error_message   TEXT,                   -- if failed

  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME
);

CREATE INDEX IF NOT EXISTS idx_productions_user ON design_productions(user_id);
CREATE INDEX IF NOT EXISTS idx_productions_brand ON design_productions(brand_id);
```

### 2.6 Brand Kit Links Table (Vault Sharing)
```sql
CREATE TABLE IF NOT EXISTS brand_kit_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id    INTEGER NOT NULL REFERENCES brands(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  token       TEXT UNIQUE NOT NULL,   -- cryptographically random, URL-safe
  title       TEXT,                   -- optional: "Share with agency", "Press kit"
  permissions TEXT DEFAULT 'view',    -- 'view' | 'download'
  
  -- Access tracking
  view_count  INTEGER DEFAULT 0,
  last_viewed DATETIME,

  expires_at  DATETIME,               -- NULL = never expires
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at  DATETIME                -- NULL = active
);

CREATE INDEX IF NOT EXISTS idx_kit_links_brand ON brand_kit_links(brand_id);
CREATE INDEX IF NOT EXISTS idx_kit_links_token ON brand_kit_links(token);
```

### 2.7 Education Moments Table
```sql
CREATE TABLE IF NOT EXISTS education_moments (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  context  TEXT NOT NULL,
  -- values: field_hint | loading_tip | post_generation | between_screens | onboarding

  category TEXT NOT NULL,
  -- values: naming | color | typography | logo | strategy | architecture | voice | general

  content  TEXT NOT NULL,   -- The educational text (markdown supported)
  headline TEXT,            -- Optional short headline for the moment
  source   TEXT,            -- Attribution (e.g., "Loyola University Study")
  stat     TEXT,            -- If there's a specific statistic to highlight

  -- Control display
  weight   INTEGER DEFAULT 1,  -- higher weight = shown more often
  active   INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.8 Generation Jobs Table
```sql
-- Tracks async generation tasks for SSE streaming
CREATE TABLE IF NOT EXISTS generation_jobs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id    INTEGER REFERENCES brands(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  job_type    TEXT NOT NULL,   -- 'brand_generate' | 'brand_refine' | 'sub_brand' | 'studio_produce'
  status      TEXT DEFAULT 'queued',  -- queued | step_1 | step_2 | step_3 | step_4 | step_5 | complete | failed
  progress    INTEGER DEFAULT 0,      -- 0-100
  current_step TEXT,                  -- human-readable current step
  result      TEXT,                   -- JSON result when complete
  error       TEXT,                   -- error message if failed
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_jobs_user ON generation_jobs(user_id);
```

---

## 3. API ENDPOINTS

### Base URL
All endpoints: `http://localhost:3800/api`  
Auth: Bearer token in `Authorization` header (existing JWT pattern)

### 3.1 Auth (EXISTING — preserve)

```
POST /api/auth/register
Body: { email: string, password: string }
Response: { token: string, user: { id, email } }

POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: { id, email } }

GET /api/auth/me
Auth: required
Response: { user: { id, email, created_at } }
```

### 3.2 Brands

#### Generate New Brand
```
POST /api/brands/generate
Auth: required
Body: {
  brand_idea: string,    // required
  product: string,       // required
  audience: string,      // required
  vibe: string,          // required: bold|minimal|warm|technical|playful|luxury|organic|futuristic
  category?: string,
  parent_brand_id?: number  // if creating a sub-brand
}

Response (immediate — async job started):
{
  job_id: number,
  brand_id: number,  // brand row created immediately with status: 'draft'
  stream_url: string  // SSE endpoint: /api/brands/generate/:job_id/stream
}
```

#### Stream Generation Progress (SSE)
```
GET /api/brands/generate/:jobId/stream
Auth: required
Response: text/event-stream

Events:
  event: step
  data: { step: number, name: string, progress: number, message: string }

  event: step_complete
  data: { step: number, name: string, data: object }  // partial data for that step

  event: complete
  data: { brand_id: number, brand: BrandObject }

  event: error
  data: { message: string, step: number }
```

#### Refine Brand
```
POST /api/brands/:id/refine
Auth: required (must own brand)
Body: {
  section: 'strategy' | 'naming' | 'visual' | 'voice',
  feedback: string,       // user's refinement instruction
  specific_field?: string // e.g., 'colors', 'tagline', 'logo_direction'
}

Response: Same as generate (job_id + stream_url)
```

#### List Brands
```
GET /api/brands
Auth: required
Query params:
  status?: 'draft' | 'active' | 'archived'
  brand_type?: 'standalone' | 'parent' | 'sub-brand' | 'endorsed'
  parent_id?: number   // get sub-brands of a parent
  search?: string      // search by name
  sort?: 'created_at' | 'updated_at' | 'name'
  order?: 'asc' | 'desc'
  page?: number        // default 1
  per_page?: number    // default 20, max 50

Response: {
  brands: BrandListItem[],
  total: number,
  page: number,
  per_page: number
}

BrandListItem: {
  id, name, tagline, brand_type, status, category,
  created_at, updated_at,
  primary_color?: string,    // from strategy.visual_identity.colors.primary.hex
  logo_thumbnail?: string,   // URL to logo thumbnail
  sub_brand_count: number    // how many sub-brands
}
```

#### Get Full Brand
```
GET /api/brands/:id
Auth: required (must own, or valid share token in ?token=)
Response: {
  brand: FullBrandObject,
  assets: BrandAsset[],
  architecture: {
    parent?: BrandSummary,
    children: BrandSummary[]
  }
}

FullBrandObject includes all brand columns + parsed strategy JSON
```

#### Update Brand
```
PUT /api/brands/:id
Auth: required
Body: {
  name?: string,
  tagline?: string,
  status?: 'draft' | 'active' | 'archived',
  category?: string,
  subcategory?: string,
  brand_type?: string
}
Response: { brand: FullBrandObject }
```

#### Delete Brand (Soft)
```
DELETE /api/brands/:id
Auth: required
Body: { confirm: true }
Response: { success: true }
// Sets deleted_at, does NOT destroy assets
// All sub-brands are also soft-deleted
```

#### Create Sub-brand
```
POST /api/brands/:id/sub-brand
Auth: required
Body: {
  brand_idea: string,
  product: string,
  audience: string,
  vibe: string,
  relationship_type: 'sub-brand' | 'endorsed',
  position?: number
}

Response: Same as generate (job_id + stream_url)
// Pipeline runs with parent brand context injected into Step 5
```

#### Get Brand Architecture Tree
```
GET /api/brands/:id/architecture
Auth: required
Response: {
  root: BrandTreeNode
}

BrandTreeNode: {
  id, name, tagline, brand_type, primary_color, logo_thumbnail,
  relationship_type?: string,
  position: number,
  children: BrandTreeNode[]
}
// Recursively builds full tree from this brand down
```

#### Update Architecture
```
PUT /api/brands/:id/architecture
Auth: required
Body: {
  operations: [
    { type: 'move', child_id: number, new_parent_id: number, position: number },
    { type: 'update_relationship', child_id: number, relationship_type: string },
    { type: 'remove', child_id: number }
  ]
}
Response: { architecture: BrandTreeNode }
```

### 3.3 Vault (Assets)

#### List Assets
```
GET /api/brands/:id/assets
Auth: required
Query: asset_type?: string, current_only?: boolean (default true)
Response: {
  assets: BrandAsset[],
  grouped: {
    logos: BrandAsset[],
    colors: BrandAsset[],
    typography: BrandAsset[],
    patterns: BrandAsset[],
    productions: BrandAsset[]
  }
}
```

#### Get Specific Asset
```
GET /api/brands/:id/assets/:assetId
Auth: required
Response: { asset: BrandAsset }
```

#### Asset Version History
```
GET /api/brands/:id/assets/:assetId/versions
Auth: required
Response: {
  versions: BrandAsset[],  // all versions, sorted newest first
  current_version: number
}
```

#### Upload Custom Asset
```
POST /api/brands/:id/assets/upload
Auth: required
Content-Type: multipart/form-data
Fields:
  file: File (max 20MB)
  asset_type: string
  replace_current?: boolean  // if true, marks old as non-current
Response: { asset: BrandAsset }
```

#### Download Brand Kit (ZIP)
```
GET /api/brands/:id/kit
Auth: required
Query:
  formats?: string  // comma-separated: svg,png,pdf (default all)
  include?: string  // comma-separated asset types to include (default all)
Response: application/zip
Content-Disposition: attachment; filename="[brand-name]-brand-kit.zip"

ZIP structure:
  [brand-name]-brand-kit/
    README.md              -- brand kit overview
    brand-guidelines.pdf   -- full guidelines document
    logos/
      primary/
        logo-primary.svg
        logo-primary.png (1x, 2x, 4x)
        logo-primary.pdf
      mark/
      wordmark/
      monochrome/
      reversed/
      favicon/
        favicon.ico
        favicon-32.png
        favicon-16.png
        apple-touch-icon.png
    colors/
      color-palette.pdf
      color-palette.svg
      colors.css          -- CSS custom properties
      colors.json         -- hex values
    typography/
      typography-specimen.pdf
    patterns/
    usage-guide/
      dos-and-donts.pdf
```

#### Create Share Link
```
POST /api/brands/:id/share
Auth: required
Body: {
  permissions: 'view' | 'download',
  expires_in?: number,    // seconds until expiry, null = never
  title?: string          // label for this share
}
Response: {
  link: {
    id, token, url, permissions, expires_at, created_at
  }
}
// URL format: https://howiconic.com/brand/:token (or localhost:3800 for dev)
```

#### List Share Links
```
GET /api/brands/:id/share
Auth: required
Response: { links: BrandKitLink[] }
```

#### Revoke Share Link
```
DELETE /api/brands/:id/share/:linkId
Auth: required
Response: { success: true }
```

#### Public Brand Kit View
```
GET /api/share/:token
Auth: NOT required (public)
Response: {
  brand: PublicBrandObject,  // sanitized, no user info
  assets: PublicAsset[],
  permissions: 'view' | 'download',
  brand_name: string
}

// Increments view_count, updates last_viewed
// Returns 404 if token not found, revoked, or expired
```

### 3.4 Studio

#### List Templates
```
GET /api/studio/templates
Auth: required
Query: type?: string (business_card|letterhead|social_ig|etc.)
Response: {
  templates: Template[],
  categories: {
    name: string,
    slug: string,
    templates: Template[]
  }[]
}

Template: {
  id: string,
  name: string,
  description: string,
  category: string,
  production_type: string,
  thumbnail_url: string,
  dimensions: { width: number, height: number, unit: 'px' | 'mm' | 'in' },
  customizable_fields: TemplateField[],
  output_formats: string[]
}

TemplateField: {
  key: string,
  label: string,
  type: 'text' | 'image' | 'color' | 'boolean',
  required: boolean,
  default?: any,
  max_length?: number
}
```

#### Generate Design
```
POST /api/studio/generate
Auth: required
Body: {
  brand_id: number,
  template_id: string,
  content: object,    // fields matching template's customizable_fields
  output_format?: 'pdf' | 'png' | 'svg'
}
Response: {
  production_id: number,
  status: 'generating',
  stream_url: string  // SSE for generation progress
}
```

#### List Productions
```
GET /api/studio/productions
Auth: required
Query:
  brand_id?: number
  production_type?: string
  page?: number
  per_page?: number
Response: {
  productions: DesignProduction[],
  total: number
}
```

#### Get Production
```
GET /api/studio/productions/:id
Auth: required
Response: { production: DesignProduction }
```

### 3.5 Education

#### Get Tip
```
GET /api/education/tip
Auth: NOT required
Query:
  context: 'loading' | 'between_screens' | 'onboarding' | 'post_generation'
  category?: string   // filter by category
Response: {
  tip: {
    id, headline, content, stat, source, category
  }
}
```

#### Get Field Hint
```
GET /api/education/hint
Auth: NOT required
Query:
  field: 'brand_idea' | 'product' | 'audience' | 'vibe' | 'naming' | 'colors' | 'typography' | 'logo' | 'voice'
Response: {
  hint: {
    id, content, headline, examples?: string[]
  }
}
```

### 3.6 Compare

#### Compare Brands
```
POST /api/brands/compare
Auth: required
Body: {
  brand_ids: number[]  // 2-3 brand IDs, all must belong to user
}
Response: {
  comparison: {
    brands: ComparisonBrand[],
    diff: {
      colors: ColorDiff[],
      typography: TypographyDiff,
      strategy: StrategyDiff,
      naming: NamingDiff
    }
  }
}

ComparisonBrand: {
  id, name, tagline, brand_type, status,
  strategy: StrategyJSON,
  primary_logo_url?: string
}
```

---

## 4. GENERATION PIPELINE (v4)

### Overview

The pipeline runs as an async job. The frontend connects via SSE for real-time progress. Each step completes and returns partial data before moving to the next.

**Total generation time target:** 45–60 seconds  
**Progress breakdown:** Step 1: 20%, Step 2: 40%, Step 3: 65%, Step 4: 85%, Step 5: 100%

### Pipeline Orchestrator (Go)

```go
// pipeline/generator.go
type GenerationConfig struct {
  BrandID       int64
  UserID        int64
  Input         BrandInput
  IsSubBrand    bool
  ParentBrand   *Brand  // populated if sub-brand
  RefinementMode bool
  RefineFeedback string
  RefineSection  string
}

// Steps run sequentially; each emits SSE events
func RunGenerationPipeline(ctx context.Context, job GenerationJob, events chan<- SSEEvent) error
```

### Step 1: Strategy (Gemini 2.5 Flash)

**Duration target:** ~8 seconds  
**SSE event emitted:** `step_complete` with strategy data

**System Prompt:**
```
You are a senior brand strategist with 20 years of experience building iconic brands.
Your job is to develop the complete strategic foundation for a new brand.
Be specific, bold, and avoid generic platitudes. Think like Paul Rand meets McKinsey.
Output must be valid JSON matching the schema provided.
```

**User Prompt template:**
```
Build a complete brand strategy for:
- Brand Idea: {{.BrandIdea}}
- Product/Service: {{.Product}}
- Target Audience: {{.Audience}}
- Desired Vibe: {{.Vibe}}
{{if .IsSubBrand}}
- Parent Brand: {{.ParentBrand.Name}} ({{.ParentBrand.Strategy.Positioning}})
- Relationship: {{.RelationshipType}}
{{end}}

Return JSON with:
{
  "positioning": "The only [category] that [unique benefit] for [specific audience]",
  "values": ["value1", "value2", "value3", "value4", "value5"],
  "personality": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "promise": "One sentence brand promise",
  "competitive_angle": "What makes this different from all alternatives",
  "target_feeling": "How customers should feel when they interact with this brand",
  "archetype": "One of: Hero|Sage|Outlaw|Explorer|Creator|Ruler|Magician|Lover|Jester|Caregiver|Everyman|Innocent"
}
```

**Output stored in:** `brands.strategy` (partial — strategy fields)  
**Education moment triggered:** "Strategy first, logo second" (see Education System)

---

### Step 2: Naming (Gemini 2.5 Flash)

**Duration target:** ~8 seconds  
**Input:** Step 1 output + original inputs

**User Prompt template:**
```
You are a brand naming expert (think Landor, Interbrand).
Using this brand strategy, generate 3 original, coined brand names:

Strategy:
- Positioning: {{.Positioning}}
- Values: {{.Values}}
- Personality: {{.Personality}}
- Audience: {{.Audience}}
- Product: {{.Product}}

Requirements for each name:
1. Must be coined/invented (not existing words)
2. Should be 1-2 syllables if possible
3. Must be pronounceable globally
4. Should have etymology/construction logic
5. Should NOT exist as a registered trademark in this category

Return JSON:
{
  "names": [
    {
      "name": "Invented name",
      "etymology": "How this word was constructed (e.g., Latin root + suffix)",
      "story": "Why this name fits this brand specifically",
      "domain_available": true,
      "domain_alternatives": [".io", ".co"]
    }
  ]
}
```

**Domain availability check:** After Gemini returns names, backend performs DNS lookup for `.com` availability. If domain resolves → `domain_available: false`. This is a best-effort check, not a legal guarantee.

**Domain Check Implementation (Go):**
```go
func CheckDomainAvailability(name string) bool {
  domain := strings.ToLower(name) + ".com"
  _, err := net.LookupHost(domain)
  return err != nil // no resolution = likely available
}
```

---

### Step 3: Visual Identity (Gemini 2.5 Flash + Recraft V4)

**Duration target:** ~15 seconds (Gemini 8s + Recraft 7s)

#### Step 3a: Color & Typography (Gemini)

**User Prompt:**
```
You are a world-class visual identity designer.
Design the complete visual system for {{.BrandName}}:

Strategy context:
- Positioning: {{.Positioning}}
- Personality: {{.Personality}}
- Archetype: {{.Archetype}}
- Vibe: {{.Vibe}}
- Category: {{.Category}}

Rules:
- Colors must be UNEXPECTED for this category (own differentiation)
- Typography must match brand personality precisely
- Every choice needs a rationale tied to strategy
- Consider cultural context (audience location/demographics)

Return JSON:
{
  "colors": {
    "primary": { "hex": "#XXXXXX", "name": "Color Name", "rationale": "Why this color for this brand" },
    "secondary": { "hex": "#XXXXXX", "name": "Color Name", "rationale": "Supporting role" },
    "accent": { "hex": "#XXXXXX", "name": "Color Name", "rationale": "Action/highlight color" },
    "neutral_light": { "hex": "#XXXXXX", "name": "Near-white" },
    "neutral_dark": { "hex": "#XXXXXX", "name": "Near-black" }
  },
  "typography": {
    "heading": { "family": "Font Family Name", "weight": "700", "rationale": "Why this typeface" },
    "body": { "family": "Font Family Name", "weight": "400", "rationale": "Readability choice" }
  },
  "logo_direction": "Detailed description of logo concept for the SVG generator",
  "logo_archetype": "wordmark|lettermark|pictorial|combination|emblem",
  "design_principles": ["principle1", "principle2", "principle3"]
}
```

#### Step 3b: Logo SVG Generation (Geometric)

Backend generates a geometric SVG logo based on:
1. Brand name (for wordmark/lettermark)
2. Logo archetype from Gemini output
3. Primary color from Gemini output
4. Logo direction description

**SVG Generation Logic (Go):**
```go
// For wordmarks: Use embedded font data + path generation for clean SVG
// For lettermarks: Generate geometric letterform from initials
// For combinations: Letter/geometric mark + wordmark text
// For pictorials: Generate geometric shapes based on logo_direction keywords

func GenerateLogoSVG(config LogoConfig) (string, error) {
  // Returns clean, self-contained SVG
  // Includes: primary logo, monochrome version, reversed version
  // Grid: based on 8px unit grid
  // Includes exclusion zone markup in metadata comment
}
```

**Optional: Recraft V4 Logo** (if RECRAFT_API_KEY is set):
```go
// Generate vector logo via Recraft V4
func GenerateRecraftLogo(prompt string, style string) (string, error) {
  // Returns SVG URL
  // Prompt built from: brand name + logo_direction + colors + personality
  // Style: "vector_illustration" or "logo"
}
```

**7-Point Quality Check (automated):**
```go
type QualityCheck struct {
  WorksInBW        bool
  ScalesTo16px     bool  // test: render at 16px, check pixel clarity
  IsDistinctive    bool  // compare against category common shapes
  IsAppropriate    bool  // strategy match score
  IsMemorable      float64 // 0-1 simplicity score
  IsTimeless       bool  // no trend markers detected
  IsVersatile      bool  // works on both light/dark backgrounds
  OverallScore     int   // 0-100
  Flags            []string
}
```

---

### Step 4: Voice & Tone (Gemini 2.5 Flash)

**Duration target:** ~8 seconds

**User Prompt:**
```
You are a brand copywriter and voice strategist.
Develop the complete verbal identity for {{.BrandName}}:

Brand context:
- Strategy: {{.Strategy}}
- Personality: {{.Personality}}
- Archetype: {{.Archetype}}
- Target feeling: {{.TargetFeeling}}
- Visual vibe: {{.Vibe}}

Return JSON:
{
  "description": "Brand voice in 2-3 sentences (what kind of entity speaks this way)",
  "tone_spectrum": "e.g., 'Authoritative but approachable. Never arrogant. Never casual.'",
  "words_to_use": ["word1", ..., "word10"],
  "words_to_avoid": ["word1", ..., "word10"],
  "sample_tagline": "The brand tagline",
  "sample_about": "2-3 sentence brand description",
  "sample_social": "One Instagram/social media post",
  "sample_headline": "A website hero headline",
  "dos": ["Do use direct statements", "Do lead with benefit", "Do use active voice"],
  "donts": ["Don't use jargon", "Don't hedge", "Don't over-promise"]
}
```

---

### Step 5: Brand Architecture (Sub-brand only)

**Triggered only when:** `parent_brand_id` is set

**Duration target:** ~5 seconds

**User Prompt:**
```
You are a brand architecture strategist.
A new sub-brand is being created under an existing parent brand.

Parent brand: {{.ParentBrand.Name}}
- Positioning: {{.ParentBrand.Positioning}}
- Values: {{.ParentBrand.Values}}
- Visual: {{.ParentBrand.PrimaryColor}}, {{.ParentBrand.Typography}}

New brand: {{.NewBrand.Name}}
- Positioning: {{.NewBrand.Positioning}}
- Audience: {{.NewBrand.Audience}}
- Relationship type: {{.RelationshipType}}

Return JSON:
{
  "relationship_type": "branded_house|endorsed|sub_brand|house_of_brands",
  "visual_connection_rules": "How the new brand visually relates to parent",
  "naming_convention": "How name should reference or distance from parent",
  "parent_brand_equity_used": "What equity is borrowed vs new equity built"
}
```

**Finalization:**
After all steps complete:
1. Merge all step outputs into `strategy` JSON
2. Update `brands.status` → `'active'` (from `'draft'`)
3. Generate and store logo SVG as `brand_assets` row
4. Generate CSS custom properties file as asset
5. Emit `complete` SSE event with full brand object

---

## 5. SCREEN-BY-SCREEN UX SPEC

### Navigation Architecture

```
/ (landing — unauthenticated)
/login
/register
/engine (brand creation — authenticated)
/brand/:id (brand manual — authenticated)
/vault (brand dashboard — authenticated)
/vault/:id (brand detail / asset manager — authenticated)
/vault/:id/studio (studio — authenticated)
/vault/:id/architecture (architecture view — authenticated)
/compare (compare view — authenticated)
/share/:token (public brand kit — no auth)
```

---

### Screen 1: Landing Page

**Purpose:** Convert visitors into registered users who understand what HowIconic does.  
**Tone:** Cinematic, confident, educational. Not salesy.  
**Reference:** Linear.app meets Stripe meets a premium design agency.

#### Section 1: Hero

**Full viewport height. Dark background (#0a0a0a).**

Visual: An animated brand construction sequence. Abstract geometric shapes slowly assembling into a complete brand system — color palette, logo mark, typography specimen — all materializing from darkness. Particle-like dots connecting. Runs on loop, ~8 second cycle. CSS/canvas animation, NOT a video (performance).

```
[HERO TEXT — centered, large]

THE BRAND OPERATING SYSTEM

[Subheading — smaller, #888]
Strategy. Identity. Assets. Architecture. In one system.

[CTA buttons — row]
[MANIFEST YOUR BRAND]  [SEE HOW IT WORKS ↓]
```

**Typography:** "THE BRAND OPERATING SYSTEM" — Playfair Display, 72px/80px, letter-spacing: 0.02em  
**CTA Primary:** Outlined button, #f17022 border + text, no fill, 2px border, hover fills with 10% opacity

**Floating education badge (top-right corner):**
```
DID YOU KNOW
85% of consumers choose products based on color alone
```
Small badge, dark surface, #f17022 dot, fades in after 2s delay.

---

#### Section 2: Problem Statement

```
[SECTION HEADING]
MOST BRANDS ARE BUILT BACKWARDS

[Body — 2 columns on desktop, stacked mobile]
Column 1:
People start with logos. Then choose colors. Then write copy.
Then wonder why nothing feels coherent.

A brand isn't a logo. It's a system of meaning.
Every touchpoint — name, color, voice, architecture — must
answer to a single strategic truth.

Column 2:
[STAT CARD — dark surface]
Companies with consistent branding
see 3.5× more visibility
[source: Forbes]

[STAT CARD]
It takes 5–7 impressions
to create brand recognition
[source: Pam Moore]

[STAT CARD]
Brands with strong identity
command 20% premium pricing
[source: McKinsey]
```

**Stat cards:** Dark surface (#111), 1px border rgba(255,255,255,0.06), #f17022 number, white text

---

#### Section 3: Solution

```
[LABEL — small caps, #f17022]
WHAT HOWICONIC IS

[HEADING]
A VIRTUAL BRAND AGENCY
THAT NEVER STOPS WORKING

[Body]
Three integrated layers. One coherent system.

[THREE LAYER CARDS — horizontal row]

[ARCHITECT]
The engine. You describe your brand.
We build the complete strategic and
visual foundation. Strategy → Naming →
Visual Identity → Voice → Architecture.

[VAULT]
The living brand system. Every asset,
organized. Every version, preserved.
Share with your team. Download when needed.
Your brand grows; your Vault grows with it.

[STUDIO]
Put your brand to work. Business cards,
social posts, packaging, signage — all
auto-built from your brand system.
Consistent. Instant. Professional.
```

**Layer cards:** Large cards, dark surface, numbered (01, 02, 03), hover reveals subtle inner glow

---

#### Section 4: How It Works

```
[LABEL]
THE PROCESS

[HEADING]
FOUR INPUTS. A COMPLETE BRAND.

[STEP VISUALIZATION — horizontal timeline on desktop]

STEP 1              STEP 2              STEP 3              STEP 4
DESCRIBE            STRATEGY            IDENTITY            VOICE
Your brand          AI builds the       Colors, type,       Words that
idea in plain       invisible           logos, and          sound exactly
language            architecture        visual system       like your brand

[BELOW TIMELINE — animated brand being built in real-time mockup]
```

**Timeline:** Orange dots connected by lines. Each dot pulses on scroll into view.

---

#### Section 5: Output Showcase (The "Blown Away" Section)

**This section must be the most impressive thing on the page.**

```
[LABEL]
WHAT YOU GET

[HEADING]
A $50,000 DELIVERABLE.
GENERATED IN 60 SECONDS.
```

**Full-width interactive showcase:**
- Shows a complete brand kit for a fictional brand ("VORTA" or similar)
- Left: Brand manual pages (strategy, color palette, typography, logo system)
- Right: Collateral — business card, social post, packaging mockup
- User can click different assets to preview them
- Hover effects reveal "WHY THIS WORKS" callouts

Design detail: The brand shown in the showcase should be flawlessly executed. If anything looks amateur, this section fails. Consider hard-coding a beautiful hand-crafted example brand here.

---

#### Section 6: Education Embedded (Facts as Design Elements)

Scattered through the page — not blocks of text, but large typographic statements:

```
"A NAME IS THE FIRST ADVERTISEMENT"
— Claude Hopkins, 1923
```

```
COLOR INCREASES BRAND RECOGNITION BY 80%
```

```
"THE LOGO DOESN'T SELL THE PRODUCT. THE COMPANY DOES."
— Paul Rand
```

These appear as full-width typographic moments between sections, styled in large Playfair Display, opacity 0.2 as background elements.

---

#### Section 7: Pricing

```
[HEADING]
SIMPLE PRICING

[TWO CARDS]

FREE
— 1 brand
— Full generation pipeline
— Vault access
— Download brand kit
[START FREE]

PRO — $29/mo
— Unlimited brands
— Brand architecture
— Studio (all templates)
— Share brand kits
— Version history
— Priority generation
[START PRO]
```

Note: Pricing is aspirational — actual pricing TBD. Show this section but make it easy to update.

---

#### Section 8: Credibility

```
[HEADING]
BUILT BY PEOPLE WHO'VE BUILT REAL BRANDS

[Body]
HowIconic isn't built by engineers who read brand books.
It's built by people who've done the work —
naming companies from scratch, building visual systems
that hold up across 50 touchpoints, making things that last.

[LOGOS/REFERENCES — placeholder for actual credentials]
```

---

#### Section 9: Final CTA

```
[FULL-WIDTH SECTION — dark, centered]
YOUR BRAND IS A HYPOTHESIS
UNTIL IT'S BUILT

[BODY]
Stop guessing. Start with strategy.
Build something that lasts.

[CTA]
[MANIFEST YOUR BRAND — FREE]
```

---

### Screen 2: Engine (Brand Creation)

**Purpose:** Collect the four inputs. Guide the user with inline education. Begin generation.

**Layout:** Full-page, centered form. Minimal. Dark. The form is the hero.

#### Input Fields

**Field 1: Brand Idea**
```
[LABEL]  01 — THE IDEA

[FIELD HINT — visible below label]
Not your tagline. Not your elevator pitch.
The one thing your brand stands for at its core.
Think: "democratizing professional design" or "making menswear feel effortless."

[INPUT — large textarea]
placeholder: "What is this brand really about?"
max: 280 characters
```

**Field 2: Product**
```
[LABEL]  02 — THE PRODUCT

[FIELD HINT]
What are you actually selling or doing?
Be specific. "Premium activewear for Indian urban professionals" beats "clothing."

[INPUT]
placeholder: "What does it make, sell, or do?"
max: 280 characters
```

**Field 3: Audience**
```
[LABEL]  03 — THE AUDIENCE

[FIELD HINT]
Great brands are built for someone specific — not everyone.
The more specific, the stronger the strategy.
"Urban Indian women 25-35 who prioritize sustainability" is better than "women."

[INPUT]
placeholder: "Who is this for, exactly?"
max: 280 characters
```

**Field 4: Vibe Selector**
```
[LABEL]  04 — THE VIBE

[FIELD HINT]
This is the emotional frequency of the brand.
Choose the one that feels closest — we'll refine it in strategy.

[VIBE GRID — 8 options]
Each vibe is a card with: name, one-line description, sample color swatch

BOLD        — Confident. Direct. Takes up space.
MINIMAL     — Less is more. Quiet power. Restraint.
WARM        — Human. Inviting. Community-first.
TECHNICAL   — Precision. Data-driven. Engineering-led.
PLAYFUL     — Joy. Color. Not taking itself too seriously.
LUXURY      — Premium. Timeless. Aspirational.
ORGANIC     — Natural. Earth-connected. Authentic.
FUTURISTIC  — Forward. Progressive. Ahead of its time.
```

**Vibe cards:** Clicking one selects it (orange border, subtle background fill). Only one selectable at a time.

---

#### Submit Button

```
[FULL-WIDTH BUTTON]
M A N I F E S T
[small text below] This will take about 60 seconds.
```

**MANIFEST** is the CTA. All caps, Playfair Display, letter-spaced. Clicking it sends the form and transitions to the loading screen.

---

#### Loading Screen

Full-screen takeover. No distractions. The generation is happening.

```
[TOP — progress bar]
████████░░░░░░░░░░░░  40%

[STEP INDICATOR]
● STRATEGY  ● NAMING  ○ VISUAL  ○ VOICE  ○ COMPLETE

[CENTER — current step name, large]
BUILDING YOUR VISUAL IDENTITY

[SUBTEXT — current action]
Selecting colors that own your category...

[BOTTOM — rotating education]
[EDUCATION CARD — fades in and out every 6 seconds]
DID YOU KNOW?
Color can increase brand recognition by up to 80%.
The most powerful brands own a color — Tiffany blue,
Hermès orange, T-Mobile magenta. We're finding yours.
```

**Animation:** The education cards cross-fade. Each step completion creates a brief "flash" in the progress bar. The step dots fill in with orange as steps complete.

**Background:** Subtle animated particle field (low opacity). Not distracting.

---

### Screen 3: Brand Manual (Results)

**Purpose:** Present the complete brand system in a way that feels like a premium deliverable.

**Layout:** Single-page scrollable document. Dense but organized. Each section is a "chapter."

```
[HEADER — sticky top bar]
[← back to vault]   VORTA — Brand Manual   [REFINE] [SAVE] [EXPORT PDF]
```

---

#### Chapter 1: Strategy

```
[CHAPTER LABEL — small caps]
01 — BRAND STRATEGY

[BRAND PROMISE — large, Playfair]
"The positioning statement here"

[FOUR COLUMNS]
VALUES          PERSONALITY     PROMISE         COMPETITIVE EDGE
—               —               —               —
(5 values)      (5 traits)      (1 sentence)    (1 paragraph)

[WHY THIS WORKS — collapsed by default, expandable]
[▼ WHY THIS WORKS]
Your positioning statement follows the "only X that Y for Z" framework.
This forces specificity that generic positioning avoids.
Your five values were chosen to create maximum differentiation
from typical category players...
```

---

#### Chapter 2: The Name

```
[CHAPTER LABEL]
02 — THE NAME

[THREE NAME OPTIONS — horizontal cards]

[NAME 1 — VORTA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ETYMOLOGY    From Latin "vortex" + condensed
STORY        [Why this name fits]
DOMAIN       vorta.com — AVAILABLE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SELECT THIS NAME]

[NAME 2 — KALEX]
...

[NAME 3 — NVRI]
...
```

If user has already selected a name, show it highlighted.

**WHY THIS WORKS:**
```
Great brand names are invented, not found.
The strongest names (Google, Kodak, Häagen-Dazs) were
fabricated to be ownable. Your names were coined using
morphological construction — combining roots, suffixes,
and phoneme patterns that signal your brand's category
and personality.
```

---

#### Chapter 3: Visual Identity

```
[CHAPTER LABEL]
03 — VISUAL IDENTITY

[COLOR PALETTE]
[LARGE COLOR SWATCHES — horizontal]
Each swatch shows: color name, hex code, RGB, usage role
Below each swatch: rationale in italics

[TYPOGRAPHY]
[HEADING SPECIMEN]
Aa Bb Cc — PLAYFAIR DISPLAY 700
The quick brown fox

[BODY SPECIMEN]
Aa Bb Cc — Inter 400
The quick brown fox jumps over the lazy dog

[LOGO SYSTEM]
[LOGO PRIMARY — large, centered]
[VARIATIONS BELOW — mark only, wordmark, monochrome, reversed on dark]
[USAGE RULES — do/don't grid]

[WHY THIS WORKS]
Color appropriateness beats color preference.
The most powerful brand colors are often unexpected for their category.
[Primary color name] was chosen because it is virtually unused in [category],
giving your brand immediate visual ownership.
```

---

#### Chapter 4: Voice & Tone

```
[CHAPTER LABEL]
04 — BRAND VOICE

[VOICE DESCRIPTION]
[The brand voice description paragraph]

[TONE SPECTRUM — visual slider style]
FORMAL ───────●────── CASUAL
SERIOUS ──────────●── PLAYFUL

[SAMPLE COPY — tabbed]
[TAGLINE] [ABOUT] [SOCIAL] [HEADLINE]

TAGLINE:
"[Generated tagline]"

[WHY THIS WORKS]
Your brand voice is HOW you say things, not WHAT you say.
Two brands can offer the same product and be completely different
experiences based purely on verbal identity. Your voice was
calibrated to your [archetype] archetype — [personality trait 1]
but [personality trait 2].
```

---

#### Chapter 5: Brand Kit

```
[CHAPTER LABEL]
05 — BRAND KIT

[DOWNLOAD OPTIONS — grid]
[↓ SVG Logos]  [↓ PNG Logos]  [↓ PDF Guidelines]  [↓ Full Kit ZIP]
[↓ Color Codes CSS]  [↓ Color Codes PDF]

[SHARE KIT]
[Create Shareable Link →]
```

---

#### Action Bar (Sticky Bottom)

```
[STICKY BOTTOM BAR]
[REFINE THIS BRAND]  [CREATE SUB-BRAND]  [SAVE TO VAULT]  [EXPORT PDF]
```

**REFINE** opens a slide-up panel:
```
What would you like to refine?
[○] Strategy  [○] Names  [○] Colors  [○] Typography  [○] Logo  [○] Voice

[TEXTAREA — Your feedback]
"Make the colors more subdued. Current palette feels aggressive."

[REFINE NOW →]
```

---

### Screen 4: Vault (Brand Dashboard)

**Purpose:** Central hub for all brands. Overview, management, organization.

**Layout:** Header + sidebar (on desktop) + main content area.

```
[PAGE HEADER]
YOUR VAULT
[Search brands...]                    [+ NEW BRAND]

[VIEW TOGGLE]  [Grid] [List] [Architecture Tree]

[FILTER ROW]
All | Standalone | Parent Brands | Sub-brands | Archived
Sort: Recent ↓
```

#### Grid View

```
[BRAND CARD — 4 across on desktop, 2 on tablet, 1 on mobile]
━━━━━━━━━━━━━━━━━━━━━━━
[COLOR SWATCH — full width top strip in brand's primary color]
[LOGO — centered, if exists]
BRAND NAME
Tagline here
─────────────────────
Standalone | Active
Created 2 days ago
━━━━━━━━━━━━━━━━━━━━━━━
[•••]  [↗ Share]  [⬇ Kit]
```

**Hover state:** Card elevates (subtle box-shadow), quick-action buttons become fully visible.

#### List View

```
[TABLE]
Name | Type | Status | Created | Sub-brands | Actions
```

#### Empty State

```
[CENTERED — no brands yet]

[LARGE TYPOGRAPHY]
YOUR VAULT IS EMPTY

[BODY]
A vault is only as valuable as what's in it.
Start by manifesting your first brand.

[EDUCATION CALLOUT]
"Your brand is your most valuable business asset.
The average Fortune 500 brand is worth 20% of its
market capitalization." — Interbrand

[CTA]
[MANIFEST YOUR FIRST BRAND]
```

---

### Screen 5: Brand Detail / Asset Manager

**Purpose:** Deep dive into one brand. All assets, version history, sharing.

```
[BREADCRUMB]
Vault → VORTA

[BRAND HEADER — full width dark card]
[LOGO] VORTA
       Your brand tagline here
[EDIT DETAILS] [SHARE KIT] [DOWNLOAD ALL]

[TABS]
[ASSETS] [MANUAL] [PRODUCTIONS] [SHARE LINKS]
```

#### Assets Tab

```
[SECTION: LOGOS]
[GRID OF LOGO VARIANTS — 4 columns]
Each cell shows:
  - Preview (dark bg for primary, light for reversed)
  - Format badge (SVG, PNG)
  - Version number (v1)
  - Download button
  - Upload replacement button

[SECTION: COLORS]
[COLOR PALETTE DISPLAY]
Each color: swatch + name + hex + copy button

[SECTION: TYPOGRAPHY]
Heading font specimen
Body font specimen
[Download Font Guide PDF]

[SECTION: PATTERNS & EXTRAS]
(Empty until patterns are generated or uploaded)
[+ Upload Custom Asset]
```

#### Version History (per asset)

Clicking an asset opens a slide-over panel:
```
[SLIDE PANEL]
LOGO PRIMARY — Version History

v3 — Current
[preview thumbnail]  Uploaded 2026-03-15  [Download]

v2
[preview thumbnail]  AI Generated 2026-03-12  [Download] [Restore as Current]

v1
[preview thumbnail]  AI Generated 2026-03-10  [Download] [Restore as Current]
```

---

### Screen 6: Studio

**Purpose:** Turn the brand into production-ready design collateral.

```
[PAGE HEADER]
STUDIO
Create production-ready designs using your brand system.

[BRAND SELECTOR]
Designing for: [VORTA ↓]  ← dropdown to switch brand

[TEMPLATE GALLERY — tabbed by category]
[All] [Business] [Social] [Print] [Packaging] [Digital]
```

#### Template Card

```
[TEMPLATE CARD]
[PREVIEW THUMBNAIL]
Business Card — Minimal Stack
Standard: 85mm × 55mm
Formats: PDF, PNG
[USE TEMPLATE]
```

#### Design Editor

After selecting a template:
```
[LEFT PANEL — 1/3 width]
━━━━━━━━━━━━━━━━━━━━
CUSTOMIZE
─────────────────────
Using: VORTA brand
Colors: Auto ✓
Fonts: Auto ✓

CONTENT FIELDS:
Name: [Sarah Chen]
Title: [Creative Director]
Email: [hello@vorta.com]
Phone: [+91 98765 43210]
Website: [vorta.com]

LAYOUT OPTIONS:
[○] Minimal  [●] Bold  [○] Classic

[GENERATE →]
━━━━━━━━━━━━━━━━━━━━

[RIGHT PANEL — 2/3 width]
[LIVE PREVIEW — updates as user types]
Front
[CARD PREVIEW]
Back
[CARD PREVIEW]
```

After generating:
```
[DOWNLOAD OPTIONS]
[PDF (Print-ready)]  [PNG (2x)]  [PNG (4x)]  [Save to Vault]
```

---

### Screen 7: Brand Architecture View

**Purpose:** Visual management of brand families.

```
[PAGE HEADER]
BRAND ARCHITECTURE
[+ ADD BRAND]  [Expand All] [Collapse All]

[FULL-WIDTH TREE VISUALIZATION]

ESSDEE KNITTING MILLS                    ← parent brand (large card)
├── 92 ACTIVEWEAR                         ← sub-brand
│   ├── 92 Performance Series             ← sub-sub-brand
│   └── 92 Essentials
└── [+ ADD SUB-BRAND]

[RELATIONSHIP LEGEND]
● Branded House  ● Endorsed  ● Sub-brand  ● Sibling
```

**Tree node behavior:**
- Click → navigate to brand manual
- Drag → reorder/reparent (with confirmation dialog)
- Hover → shows: name, type, relationship badge, quick actions
- "+" node → opens create sub-brand flow

**Relationship types are color-coded:**
```
Branded House: #f17022 (orange)
Endorsed: #4A9EFF (blue)
Sub-brand: #8B5CF6 (purple)
Sibling: #6B7280 (grey)
```

---

### Screen 8: Compare View

**Purpose:** Understand how multiple brands relate, differ, or overlap.

```
[PAGE HEADER]
COMPARE BRANDS
[+ ADD BRAND TO COMPARE]  (max 3)

[BRAND SELECTORS — row]
[VORTA ×]  [92 ACTIVEWEAR ×]  [+ ADD]

[COMPARISON TABLE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    VORTA           92 ACTIVEWEAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPE                Standalone      Sub-brand
ARCHETYPE           Creator         Hero
POSITIONING         ...             ...
PRIMARY COLOR       ████ #E84545    ████ #1A1A1A
SECONDARY           ████ #F5F5F0    ████ #FF4500
HEADING FONT        Playfair 700    Monument Extended
BODY FONT           Inter 400       Inter 400
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[OVERLAP ANALYSIS]
Shared values: Quality, Authenticity
Conflicting tones: VORTA is warm; 92 is aggressive
Color harmony: Complementary — safe to co-exist in portfolio
```

---

### Screen 9: Shared Brand Kit (Public)

**URL:** `/share/:token`  
**No authentication required**

```
[TOP BAR — minimal]
BRAND KIT  [POWERED BY HOWICONIC]

[HERO — brand's primary color as accent]
[LOGO — large, centered]
BRAND NAME
Tagline

[KIT SECTIONS — clean, presentation quality]
━━━━━━━━━━━━━━━━━━━━━━━━━━
COLORS
[Swatches with hex codes]

TYPOGRAPHY
[Specimens with download links if permitted]

LOGOS
[Preview grid + download buttons if permitted]

VOICE GUIDELINES
[Sample copy snippets]
━━━━━━━━━━━━━━━━━━━━━━━━━━

[FOOTER — viral loop]
This brand was built with HowIconic
The Brand Operating System
[BUILD YOUR BRAND →]
```

**Conditional downloads:** Only shown if `permissions === 'download'`

---

## 6. EDUCATION SYSTEM

### System Architecture

Education content is stored in the `education_moments` table and seeded on first run. The API serves random tips for each context. Frontend components display them inline.

### Seed Data: 30 Education Moments

**LOADING TIPS (during 60-second generation)**

```sql
INSERT INTO education_moments (context, category, content, headline, stat, source) VALUES

('loading_tip', 'strategy',
'Brand strategy is the invisible architecture underneath everything visual. Before any designer draws a line, the strategy must answer: What are we? Who are we for? What do we stand for? Only then do colors and logos make sense.',
'Strategy first. Logo second.',
NULL,
'Brand strategy fundamentals');

('loading_tip', 'color',
'Color increases brand recognition by up to 80%. The most iconic brands own a color in their category — Tiffany blue, Hermès orange, T-Mobile magenta. The best color strategy is not the most beautiful color. It''s the most ownable one.',
'Own your color.',
'80%',
'Loyola University Maryland');

('loading_tip', 'color',
'85% of consumers cite color as the primary reason for choosing one product over another. Color communicates before words do — in 0.1 seconds, color creates an emotional response. Your palette is making promises your product has to keep.',
'Color makes promises.',
'85%',
'Loyola University Maryland');

('loading_tip', 'naming',
'The greatest brand names are invented, not found. Google. Kodak. Häagen-Dazs. None of these are real words. Coined names are harder to build recognition for, but once you do, you own the word entirely. Nobody else can be Google.',
'Invent your name.',
NULL,
'Brand naming research');

('loading_tip', 'logo',
'A logo doesn''t need to explain everything. It just needs to be unmistakably yours. The Nike swoosh meant nothing in 1971. It means everything now. Logos earn meaning through consistent use — the design just has to be right.',
'Logos earn meaning.',
NULL,
'Paul Rand, design philosophy');

('loading_tip', 'typography',
'Custom typefaces are the most defensible brand asset. Coca-Cola''s script, Disney''s font, The New York Times masthead — these typefaces are inseparable from the brand. When you can''t afford custom type, choose a typeface that''s rare in your category.',
'Type is identity.',
NULL,
'Typography and branding research');

('loading_tip', 'strategy',
'The strongest brands are for someone specific. Nike was for serious athletes before it was for everyone. Patagonia is for people who actually climb things. Specificity in your early brand builds the credibility that allows you to expand later.',
'Specific beats broad.',
NULL,
'Brand positioning principles');

('loading_tip', 'logo',
'A great logo works in black and white first. If it can''t survive without color, it''s not a strong mark. This is why every logo we build gets tested in monochrome before anything else. Color is enhancement, not foundation.',
'Black and white first.',
NULL,
'Logo design fundamentals');

('loading_tip', 'architecture',
'Brand architecture is how multiple brands in a portfolio relate to each other. Apple uses a Branded House — one master brand across all products. Unilever uses a House of Brands — separate brands that don''t reference the parent. The choice affects everything from marketing spend to acquisition strategy.',
'Architecture is strategy.',
NULL,
'Brand architecture frameworks');

('loading_tip', 'general',
'Over-investing in short-term performance marketing has cost top global brands an estimated $3.5 trillion in brand value since 2000. Brand building is slow, compounding, and often invisible — until suddenly it''s worth more than all your marketing combined.',
'Brand value compounds.',
'$3.5 trillion',
'Interbrand Global Brand Value research');
```

**FIELD HINTS (inline guidance per input)**

```sql
INSERT INTO education_moments (context, category, content, headline) VALUES

('field_hint', 'strategy',
'This is not your tagline or mission statement. It''s the raw strategic idea — the one thing your brand is fundamentally about. Example: "Making high-performance Indian activewear that competes globally." Be specific about the category you''re claiming.',
'What is this brand''s core idea?'),

('field_hint', 'strategy',
'Not "products." Specifically what. "Compression activewear for urban Indian runners" is useful. "Clothing" is not. The more specific your product definition, the more precise your strategy can be.',
'What does it actually make or do?'),

('field_hint', 'strategy',
'The most common mistake in brand building: defining the audience as "everyone." Every iconic brand was built for someone specific. "Urban professionals aged 28-40 who care about performance and aesthetics" is an audience. "Anyone who exercises" is not.',
'Who is this for, exactly?'),

('field_hint', 'general',
'Vibe sets the emotional register of everything: color temperature, type choice, copy voice, logo style. Choose the one that feels closest to the brand''s emotional truth — not what you want to be, but what this brand actually is.',
'What emotional frequency does this brand operate on?');
```

**POST-GENERATION INSIGHTS (in Brand Manual)**

```sql
INSERT INTO education_moments (context, category, content, headline) VALUES

('post_generation', 'strategy',
'Your positioning statement follows the "only X that Y for Z" framework. This forces specificity that generic positioning avoids. A brand that tries to be "the best" at everything is the best at nothing. Owning a specific position in a specific category is how you become irreplaceable.',
'Why your strategy is built this way'),

('post_generation', 'naming',
'Great brand names are invented, not found. Your names were coined using morphological construction — combining roots, suffixes, and phoneme patterns that signal your brand''s category while remaining ownable. A coined name has no existing baggage. You define what it means.',
'Why your names were coined'),

('post_generation', 'color',
'Color appropriateness matters more than color preference. The most powerful brand colors are often unexpected for their category — and that unexpectedness is the strategy. Owning a color that no competitor uses creates immediate visual differentiation.',
'Why these colors work'),

('post_generation', 'typography',
'Typography communicates before words are read. Serif fonts signal authority and tradition. Geometric sans-serifs signal modernity and precision. Humanist sans-serifs signal friendliness and accessibility. Your typeface pairing was chosen to embody your brand archetype.',
'Why these typefaces'),

('post_generation', 'logo',
'Your logo was built on a geometric grid using a 8px unit system. This creates mathematical relationships between elements that make the mark feel considered and balanced even when the viewer doesn''t know why. Logos built on grids hold up at any scale.',
'Why this logo construction'),

('post_generation', 'voice',
'Your brand voice is how you say things, not what you say. Two brands can offer identical products and feel completely different based purely on verbal identity. Your voice was calibrated to your brand archetype — a set of communication patterns your audience recognizes as distinctly yours.',
'Why this voice');
```

**ONBOARDING (first-time user)**

```sql
INSERT INTO education_moments (context, category, content, headline) VALUES

('onboarding', 'general',
'Most people think branding starts with a logo. It doesn''t. Branding starts with strategy — the answer to "what are we, and why does that matter?" The logo is just the flag that gets planted once the territory is claimed.',
'Branding isn''t the logo'),

('onboarding', 'general',
'A brand is a set of promises made consistently over time. Every touchpoint — your name, your colors, your words, your packaging, your customer service — either keeps or breaks the promise. HowIconic builds the promise, then builds the system to keep it.',
'A brand is a promise'),

('onboarding', 'general',
'The difference between a product and a brand is meaning. A product is what you sell. A brand is why people care. Apple sells computers. But it sells them to people who believe creativity changes the world. That belief is the brand.',
'Products vs brands'),

('between_screens', 'general',
'You''re about to see something most founders never get: a complete brand strategy, not just a logo. The strategy is the thing that makes every visual decision coherent. Without it, design is decoration.',
'What you''re about to see');
```

---

## 7. DESIGN SYSTEM

### 7.1 Color Palette

```css
:root {
  /* Brand */
  --color-primary: #f17022;
  --color-primary-hover: #d9601e;
  --color-primary-dim: rgba(241, 112, 34, 0.1);
  --color-primary-border: rgba(241, 112, 34, 0.3);

  /* Backgrounds */
  --color-bg: #0a0a0a;
  --color-surface-1: #111111;
  --color-surface-2: #161616;
  --color-surface-3: #1c1c1c;
  --color-surface-hover: #1e1e1e;

  /* Borders */
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-subtle: rgba(255, 255, 255, 0.04);
  --color-border-strong: rgba(255, 255, 255, 0.12);

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a1a1aa;
  --color-text-tertiary: #71717a;
  --color-text-placeholder: #52525b;
  --color-text-inverse: #0a0a0a;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Special */
  --color-highlight: rgba(241, 112, 34, 0.08);
  --color-overlay: rgba(0, 0, 0, 0.8);
}
```

### 7.2 Typography

```css
/* Font imports — add to index.html */
/* Playfair Display: 400, 700 */
/* Inter: 300, 400, 500, 600 */
/* JetBrains Mono: 400, 500 (for data/code) */

:root {
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Type scale — base 16px */
.text-xs    { font-size: 11px; line-height: 16px; }
.text-sm    { font-size: 13px; line-height: 20px; }
.text-base  { font-size: 15px; line-height: 24px; }
.text-lg    { font-size: 18px; line-height: 28px; }
.text-xl    { font-size: 20px; line-height: 30px; }
.text-2xl   { font-size: 24px; line-height: 32px; }
.text-3xl   { font-size: 30px; line-height: 38px; }
.text-4xl   { font-size: 36px; line-height: 44px; }
.text-5xl   { font-size: 48px; line-height: 56px; }
.text-6xl   { font-size: 60px; line-height: 68px; }
.text-7xl   { font-size: 72px; line-height: 80px; }

/* Heading classes */
.heading-xl  { font-family: var(--font-heading); font-size: 72px; font-weight: 700; letter-spacing: 0.02em; }
.heading-lg  { font-family: var(--font-heading); font-size: 48px; font-weight: 700; }
.heading-md  { font-family: var(--font-heading); font-size: 36px; font-weight: 700; }
.heading-sm  { font-family: var(--font-heading); font-size: 24px; font-weight: 400; font-style: italic; }

/* Label class */
.label       { font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-tertiary); }
```

### 7.3 Spacing Scale

```css
/* 4px base unit */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### 7.4 Border Radius

```css
/* Sharp design — minimal rounding */
--radius-none: 0;
--radius-sm: 2px;     /* Cards, inputs */
--radius-md: 4px;     /* Modals, panels */
--radius-lg: 6px;     /* Large surfaces */
/* NO rounded pills. Never border-radius > 6px on core UI */
```

### 7.5 Animation

```css
/* Transitions */
--transition-fast:   100ms ease;
--transition-base:   200ms ease;
--transition-slow:   300ms ease;
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Usage rules:
   - Hover states: 100ms
   - State changes (color, opacity): 200ms
   - Slide-in panels, modals: 300ms ease
   - Loading/progress: use CSS animation not transition
   - MAX transition: 300ms (never exceed)
   - Prefer opacity + transform (GPU-accelerated)
   - Avoid animating layout properties (width, height, padding)
*/

/* Standard entrance animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Used for content sections appearing on scroll */
.animate-in {
  animation: fadeIn 300ms ease forwards;
}
```

### 7.6 Component Specs

#### Cards
```css
.card {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-6);
  transition: border-color var(--transition-base);
}

.card:hover {
  border-color: var(--color-border-strong);
}

.card-elevated {
  background: var(--color-surface-2);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
```

#### Buttons
```css
/* Primary — outlined orange */
.btn-primary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--color-primary-dim);
}

.btn-primary:active {
  background: rgba(241, 112, 34, 0.2);
  transform: translateY(1px);
}

/* Secondary — ghost */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
}

/* Danger */
.btn-danger {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--color-error);
}
```

#### Inputs
```css
.input {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 15px;
  padding: 10px 14px;
  width: 100%;
  transition: border-color var(--transition-fast);
  resize: vertical; /* for textareas */
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-border);
  box-shadow: 0 0 0 3px var(--color-primary-dim);
}

.input::placeholder {
  color: var(--color-text-placeholder);
}
```

### 7.7 The "ONLY ON HOWICONIC" Badge

Used for features that differentiate HowIconic from competitors.

```html
<span class="badge-exclusive">ONLY ON HOWICONIC</span>
```

```css
.badge-exclusive {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: 1px solid var(--color-primary-border);
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

/* Usage: place next to feature names in marketing copy,
   in Studio template cards for premium templates,
   in the landing page feature list */
```

Where to place the badge:
- Brand Architecture view (tree visualization)
- Brand Compare feature
- 7-point quality check display
- Domain availability check in naming step
- Studio templates for packaging/label types
- Public brand kit sharing

### 7.8 Grid & Layout

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Responsive breakpoints */
/* Desktop: 1200px max */
/* Tablet: 768px–1199px */
/* Mobile: <768px */

@media (max-width: 768px) {
  .container { padding: 0 var(--space-4); }
  .grid { grid-template-columns: repeat(4, 1fr); }
  .heading-xl { font-size: 40px; }
  .heading-lg { font-size: 32px; }
}
```

### 7.9 Icons

Use **Lucide React** icons throughout. Line-based, minimal, consistent stroke weight (1.5px).

Core icon set used:
- `Download`, `Upload`, `Share2`, `Link`, `Copy`
- `ChevronDown`, `ChevronRight`, `ArrowLeft`
- `Plus`, `X`, `Edit3`, `Trash2`
- `Eye`, `EyeOff`
- `Grid`, `List`, `TreePine` (architecture)
- `Palette`, `Type`, `ImageIcon`, `Layers`
- `CheckCircle`, `AlertCircle`, `Clock`
- `Sparkles` (AI generation indicator)

---

## 8. TECH STACK & ARCHITECTURE

### 8.1 Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│         React 18 + TypeScript + Vite                     │
│         Served from: /frontend/dist                      │
└─────────────────────────┬───────────────────────────────┘
                           │ HTTP + SSE
                           │ Port 3800
┌─────────────────────────▼───────────────────────────────┐
│                    GO BACKEND                            │
│         Single binary, port 3800                         │
│         Serves: /api/* + static /frontend/dist           │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  HTTP Router │  │  Pipeline    │  │  Asset Store  │  │
│  │  (chi/gorilla│  │  Orchestrator│  │  /assets/     │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                SQLite Database                    │   │
│  │           /data/howiconic.db                      │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ API calls
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌──────▼─────┐   ┌───▼──────┐
   │ Gemini  │    │  Recraft   │   │  DALL-E  │
   │ 2.5 F   │    │     V4     │   │    3     │
   └─────────┘    └────────────┘   └──────────┘
```

### 8.2 Backend Structure (Go)

```
howiconic/
├── main.go                 # Entry point, router setup
├── go.mod
├── go.sum
├── .env                    # API keys, config
├── data/
│   └── howiconic.db        # SQLite database
├── assets/                 # Generated/uploaded files
│   ├── logos/
│   ├── kits/
│   └── productions/
├── internal/
│   ├── db/
│   │   ├── db.go           # DB connection, migrations
│   │   ├── brands.go       # Brand CRUD
│   │   ├── assets.go       # Asset CRUD
│   │   ├── architecture.go
│   │   ├── productions.go
│   │   ├── kitlinks.go
│   │   └── education.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── brands.go
│   │   ├── vault.go
│   │   ├── studio.go
│   │   ├── education.go
│   │   ├── compare.go
│   │   └── share.go
│   ├── pipeline/
│   │   ├── generator.go    # Main orchestrator
│   │   ├── strategy.go     # Step 1
│   │   ├── naming.go       # Step 2
│   │   ├── visual.go       # Step 3
│   │   ├── voice.go        # Step 4
│   │   ├── architecture.go # Step 5
│   │   ├── svg.go          # SVG logo generator
│   │   └── quality.go      # 7-point check
│   ├── ai/
│   │   ├── gemini.go       # Gemini client
│   │   ├── recraft.go      # Recraft V4 client
│   │   └── dalle.go        # DALL-E 3 client
│   ├── pdf/
│   │   └── generator.go    # PDF brand manual generator
│   ├── zip/
│   │   └── kitbuilder.go   # ZIP brand kit builder
│   ├── middleware/
│   │   ├── auth.go         # JWT middleware
│   │   └── cors.go
│   └── models/
│       └── types.go        # Shared Go types
├── templates/
│   └── studio/             # Studio template definitions (JSON)
└── frontend/               # React frontend (existing)
```

### 8.3 Frontend Structure (React + TypeScript)

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx             # Router setup
│   ├── api/
│   │   ├── client.ts       # Axios instance + auth header
│   │   ├── brands.ts       # Brand API calls
│   │   ├── vault.ts        # Asset API calls
│   │   ├── studio.ts       # Studio API calls
│   │   ├── education.ts    # Education API calls
│   │   └── sse.ts          # SSE hook for streaming
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Engine.tsx      # Brand creation form
│   │   ├── BrandManual.tsx # Results page
│   │   ├── Vault.tsx       # Brand dashboard
│   │   ├── BrandDetail.tsx # Asset manager
│   │   ├── Studio.tsx      # Design production
│   │   ├── Architecture.tsx
│   │   ├── Compare.tsx
│   │   └── ShareKit.tsx    # Public page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NavBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── brand/
│   │   │   ├── BrandCard.tsx
│   │   │   ├── BrandForm.tsx
│   │   │   ├── VibeSelector.tsx
│   │   │   ├── ColorPalette.tsx
│   │   │   ├── LogoDisplay.tsx
│   │   │   ├── TypographySpec.tsx
│   │   │   └── StrategyDisplay.tsx
│   │   ├── vault/
│   │   │   ├── AssetGrid.tsx
│   │   │   ├── AssetCard.tsx
│   │   │   ├── VersionHistory.tsx
│   │   │   └── ShareLinkManager.tsx
│   │   ├── studio/
│   │   │   ├── TemplateGallery.tsx
│   │   │   ├── TemplateCard.tsx
│   │   │   └── DesignEditor.tsx
│   │   ├── architecture/
│   │   │   ├── BrandTree.tsx
│   │   │   └── BrandNode.tsx
│   │   ├── education/
│   │   │   ├── LoadingTips.tsx
│   │   │   ├── FieldHint.tsx
│   │   │   └── PostGenInsight.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── SlidePanel.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ExclusiveBadge.tsx
│   ├── hooks/
│   │   ├── useSSE.ts       # SSE connection hook
│   │   ├── useAuth.ts      # Auth state
│   │   └── useBrand.ts     # Brand data hook
│   ├── store/
│   │   └── auth.ts         # Zustand auth store
│   └── styles/
│       ├── globals.css     # CSS custom properties + resets
│       ├── typography.css
│       └── animations.css
```

### 8.4 AI Configuration

```go
// .env
GEMINI_API_KEY=your_key_here
RECRAFT_API_KEY=your_key_here          // optional
OPENAI_API_KEY=your_key_here           // optional, for DALL-E concept art
JWT_SECRET=your_secret_here
PORT=3800
ASSETS_DIR=./assets
DB_PATH=./data/howiconic.db
```

**Model config:**
```go
const (
  GeminiModel       = "gemini-2.5-flash"
  GeminiTemperature = 0.7   // creative but controlled
  GeminiMaxTokens   = 4096

  // Recraft V4 API endpoint
  RecraftEndpoint   = "https://external.api.recraft.ai/v1/images/generations"
  RecraftStyle      = "vector_illustration"
)
```

### 8.5 SSE Implementation (Go)

```go
// handlers/sse.go
func (h *Handler) StreamGeneration(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "text/event-stream")
  w.Header().Set("Cache-Control", "no-cache")
  w.Header().Set("Connection", "keep-alive")
  w.Header().Set("Access-Control-Allow-Origin", "*")

  // Get jobID from URL
  jobID := chi.URLParam(r, "jobId")

  // Subscribe to job events channel
  events := h.pipeline.Subscribe(jobID)
  defer h.pipeline.Unsubscribe(jobID, events)

  for {
    select {
    case event := <-events:
      fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Type, event.Data)
      w.(http.Flusher).Flush()
    case <-r.Context().Done():
      return
    }
  }
}
```

### 8.6 PDF Generation (Go)

Use `github.com/signintech/gopdf` or `github.com/go-pdf/fpdf` for server-side PDF generation.

**Brand Manual PDF Structure:**
```
Page 1: Cover — brand name, tagline, primary color
Page 2: Brand Strategy — positioning, values, personality, promise
Page 3: Color Palette — swatches with hex, RGB, CMYK values
Page 4: Typography — specimen sheets for heading and body fonts
Page 5: Logo System — primary logo, variants, usage rules
Page 6: Voice & Tone — guidelines, sample copy
Page 7: Do's & Don'ts — visual and verbal usage guide
Page 8: Back cover — "Built with HowIconic"
```

---

## 9. BUILD PHASES

### Phase 1: Foundation (Week 1-2)
**Goal:** Data layer + auth + generation pipeline working end-to-end

- [ ] Run database migrations (new tables)
- [ ] Update `brands` table with new columns
- [ ] Seed `education_moments` table with all 30 moments
- [ ] Build `GenerationJob` and SSE streaming system
- [ ] Implement Step 1 (Strategy) with Gemini
- [ ] Implement Step 2 (Naming) with domain check
- [ ] Implement Step 3 (Visual) with Gemini + geometric SVG
- [ ] Implement Step 4 (Voice)
- [ ] Wire `POST /api/brands/generate` + SSE stream endpoint
- [ ] Frontend: Engine page (form + vibe selector)
- [ ] Frontend: Loading screen with SSE connection
- [ ] Frontend: Brand Manual page (basic)

**Acceptance criteria:** Full generation flow works. User fills in 4 fields, clicks MANIFEST, sees loading screen with rotating tips, sees complete brand manual.

---

### Phase 2: Vault (Week 3)
**Goal:** Asset management and brand organization

- [ ] Asset upload and storage system
- [ ] ZIP brand kit builder
- [ ] `GET /api/brands/:id/assets` + all asset endpoints
- [ ] `GET /api/brands/:id/kit` (ZIP download)
- [ ] Frontend: Vault page (grid + list view)
- [ ] Frontend: Brand Detail + Asset Manager
- [ ] Frontend: Version history slide panel

**Acceptance criteria:** User can view all brands, download brand kit as ZIP, upload custom assets, see version history.

---

### Phase 3: Sharing + PDF (Week 4)
**Goal:** External sharing and print-quality exports

- [ ] Shareable link generation (cryptographic token)
- [ ] Public brand kit page (`/share/:token`)
- [ ] PDF brand manual generation (Go)
- [ ] `POST /api/brands/:id/share` + `GET /api/share/:token`
- [ ] Frontend: Share link manager
- [ ] Frontend: Public kit page

**Acceptance criteria:** User can create a share link, send it to anyone, they see a beautiful brand kit without logging in.

---

### Phase 4: Architecture + Compare (Week 5)
**Goal:** Multi-brand management

- [ ] Sub-brand generation (Step 5 pipeline)
- [ ] Architecture tree data layer
- [ ] `POST /api/brands/:id/sub-brand`
- [ ] `GET /api/brands/:id/architecture`
- [ ] `POST /api/brands/compare`
- [ ] Frontend: Architecture view (tree visualization)
- [ ] Frontend: Compare view (side-by-side)
- [ ] Frontend: Sub-brand creation flow

**Acceptance criteria:** User can create a sub-brand under a parent, see the full brand tree, and compare two brands side-by-side.

---

### Phase 5: Studio (Week 6)
**Goal:** Design production layer

- [ ] Template registry (JSON definitions for each template type)
- [ ] Template rendering engine (Go: compose brand elements into output)
- [ ] `GET /api/studio/templates`
- [ ] `POST /api/studio/generate`
- [ ] Frontend: Studio template gallery
- [ ] Frontend: Design editor (preview + customization)
- [ ] Frontend: Production management

**Acceptance criteria:** User can generate a business card using their brand, customize text fields, download as PDF.

---

### Phase 6: Landing Page + Polish (Week 7-8)
**Goal:** The "blown away" landing page. This phase is equal in effort to all others combined.

- [ ] Landing page — all 9 sections
- [ ] Hero animation (canvas/CSS)
- [ ] Showcase section with hard-coded example brand
- [ ] All animations (60fps, mobile-tested)
- [ ] Mobile responsive pass (all screens)
- [ ] Accessibility pass (contrast, keyboard nav)
- [ ] Performance audit (Lighthouse ≥90)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile Safari testing (Nithin's device)
- [ ] Compare against Stripe, Linear, Vercel quality bar

**Acceptance criteria:** Nithin sees the landing page and says "blown away." Every animation is 60fps on iPhone Safari. No console errors. Lighthouse ≥90.

---

### Phase 7: Refinement (Week 9)
**Goal:** Brand refinement and education system completion

- [ ] `POST /api/brands/:id/refine` endpoint
- [ ] Refinement UI (slide-up panel, section selection)
- [ ] Education moments fully wired (all contexts)
- [ ] Between-screen interstitials
- [ ] Onboarding flow for new users

---

## 10. FILE STRUCTURE

```
/home/claw/.openclaw/workspace/apps/howiconic/
├── V4-PRODUCT-SPEC.md          ← this file
├── QUALITY-BAR.md              ← existing
├── RESEARCH-BIBLE.pdf          ← existing
├── go.mod
├── go.sum
├── main.go
├── .env
├── data/
│   └── howiconic.db
├── assets/
│   ├── logos/
│   │   └── {brand_id}/
│   ├── kits/
│   │   └── {brand_id}/
│   └── productions/
│       └── {brand_id}/
├── internal/
│   ├── db/
│   ├── handlers/
│   ├── pipeline/
│   ├── ai/
│   ├── pdf/
│   ├── zip/
│   ├── middleware/
│   └── models/
├── templates/
│   └── studio/
│       ├── business_card_minimal.json
│       ├── business_card_bold.json
│       ├── social_ig_square.json
│       ├── social_ig_story.json
│       ├── letterhead_standard.json
│       ├── poster_a4_minimal.json
│       └── email_header_standard.json
└── frontend/                   ← existing, extend
    ├── src/
    │   ├── pages/              ← new pages here
    │   ├── components/         ← new components here
    │   └── styles/             ← extend globals.css
    └── public/
        └── fonts/              ← self-host if needed
```

---

## APPENDIX A: Studio Template JSON Schema

```typescript
// Template definition stored in templates/studio/*.json
interface StudioTemplate {
  id: string;                    // e.g., "business_card_minimal"
  name: string;                  // "Business Card — Minimal"
  description: string;
  category: string;              // "business" | "social" | "print" | "packaging" | "digital"
  production_type: string;       // matches design_productions.production_type
  thumbnail: string;             // path to preview image
  
  dimensions: {
    width: number;               // in mm for print, px for digital
    height: number;
    unit: 'mm' | 'px' | 'in';
    bleed?: number;              // mm bleed for print templates
  };
  
  customizable_fields: {
    key: string;
    label: string;
    type: 'text' | 'longtext' | 'image' | 'color' | 'boolean' | 'select';
    required: boolean;
    default?: any;
    max_length?: number;
    options?: string[];          // for 'select' type
    brand_overridable: boolean;  // if true, brand system value is default
  }[];
  
  brand_elements: {
    uses_primary_color: boolean;
    uses_secondary_color: boolean;
    uses_heading_font: boolean;
    uses_body_font: boolean;
    uses_logo: boolean;
    uses_logo_mark_only?: boolean;
  };
  
  output_formats: ('pdf' | 'png' | 'svg')[];
  
  // Go rendering instructions
  render_instructions: {
    engine: 'svg_template' | 'gopdf';
    template_file?: string;      // SVG template with {{.FieldName}} placeholders
  };
}
```

---

## APPENDIX B: Domain Availability Note

Domain availability checks (`net.LookupHost`) are best-effort only. A non-resolving domain is likely available but not guaranteed. The UI should reflect this:

```
vorta.com — LIKELY AVAILABLE ✓
(Based on DNS lookup — not a legal guarantee)
```

Never imply trademark availability. Add this disclaimer to the naming section:
> "Domain availability is checked via DNS lookup. This is not a trademark search. Verify availability at Namecheap/GoDaddy and consult a trademark attorney before committing to a name."

---

## APPENDIX C: Backward Compatibility

Existing `brands` rows will have NULL for new columns. Handle gracefully:
- `brand_type` → default to `'standalone'` if NULL
- `status` → default to `'active'` if NULL (existing brands are active)
- `strategy` → if NULL and `brand_data` exists (old schema), migrate on read
- New API endpoints are all additive — existing endpoints unchanged

---

## APPENDIX D: Quality Checklist (Before Any Screen Goes Live)

From `QUALITY-BAR.md`:

```
□ All animations smooth at 60fps on iPhone Safari
□ Generated brand manual looks premium ($50K-level deliverable quality)
□ No console errors anywhere
□ No loading spinners visible longer than necessary
□ Empty states are designed (not empty white boxes)
□ Error states are designed and informative
□ Loading states are beautiful
□ Mobile responsive at 375px (iPhone SE)
□ Mobile responsive at 390px (iPhone 14)
□ Tested on Safari 16+ (iOS)
□ Typography is impeccable — no orphans, no overflow
□ Every transition is intentional (no surprise jumps)
□ Color contrast meets WCAG AA (4.5:1 for text)
□ All download links work
□ Share links open correctly without auth
□ Generation completes end-to-end with real Gemini API
□ SSE stream connects and displays correctly
```

---

*End of spec. This document is the blueprint. Build from here.*

*Ram 🏹 — Essdee*

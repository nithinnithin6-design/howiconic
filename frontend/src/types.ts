export interface DalleLogo {
  style: string;
  imageData: string; // data:image/png;base64,...
}

export interface Mockup {
  type: string;
  svg: string;
}

export type SocialTemplate = Mockup;

export type MaterialOverlay = 'BIOLOGICAL' | 'OBSIDIAN' | 'AUREUM' | 'CARBON' | 'DEEPSEA';
export type IndustrialWeightClass = 'SEEDLING' | 'MONOLITH' | 'GLOBAL';
export type MaturityLevel = 1 | 2 | 3 | 4 | 5;
export type BrandClassification = 'Weak / Cosmetic' | 'Functional / Forgettable' | 'Strong / Growing' | 'Excellent / System-led' | 'Iconic Potential';

export interface PillarAudit {
  name: string;
  status: 'OPTIMIZED' | 'FRICTION' | 'CRITICAL_VOID';
  doingGood: string[];
  doingBad: string[];
  notDoing: string[];
  shouldBeDoing: string;
}

export interface LitmusResult {
  question: string;
  passed: boolean;
}

export interface ColorInfo {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  usage: string;
  emotion: string;
  ratio: number;
  // V2 extended fields
  theory?: string;
  why_not_obvious?: string;
}

export interface TypographyRole {
  fontFamily: string;
  weight: string;
  size: string;
  lineHeight: string;
  letterSpacing: string;
  usage: string;
  rationale?: string; // V2 extended
}

// ─── V2 PIPELINE TYPES ────────────────────────────────────────────────────────

export interface V2StrategyPillar {
  name: string;
  description: string;
}

export interface V2Strategy {
  archetype: string;
  archetype_reasoning: string;
  positioning_statement: string;
  competitive_whitespace: string;
  target_psychographics: {
    primary: string;
    secondary: string;
    anti_audience: string;
  };
  brand_tensions: string[];
  strategic_pillars: V2StrategyPillar[];
  competitive_landscape: {
    direct: string[];
    indirect: string[];
    displacement_opportunity: string;
  };
  brand_promise: string;
  cultural_context: string;
}

export interface V2NameCandidate {
  name: string;
  category: string;
  etymology: string;
  phonetic_quality: string;
  cultural_valence: string;
  trademark_risk: string;
  domain_pattern: string;
  memorability: number;
  brand_fit_score: number;
  reasoning: string;
}

export interface V2BrandVoice {
  tone: string;
  vocabulary: string;
  anti_vocabulary: string[];
  sentence_rhythm: string;
  example_copy: string;
}

export interface V2MessagingPillar {
  pillar: string;
  message: string;
  proof_points: string[];
}

export interface V2Verbal {
  name_candidates: V2NameCandidate[];
  selected_name: string;
  selection_rationale: string;
  tagline: string;
  tagline_rationale: string;
  alternative_taglines: string[];
  brand_voice: V2BrandVoice;
  messaging_pillars: V2MessagingPillar[];
  naming_story: string;
}

export interface V2ColorEntry {
  name: string;
  hex: string;
  rgb: number[];
  theory: string;
  psychological_effect: string;
  usage: string;
  why_not_obvious?: string;
}

export interface V2Visual {
  color_system: {
    primary: V2ColorEntry;
    secondary: V2ColorEntry;
    tertiary: V2ColorEntry;
    canvas: string;
    color_rule: string;
    color_accessibility: string;
  };
  typography: {
    primary_typeface: {
      family: string;
      weights_used: string[];
      rationale: string;
      open_source_alternative: string;
      usage: string;
    };
    secondary_typeface: {
      family: string;
      weights_used: string[];
      rationale: string;
      open_source_alternative: string;
      usage: string;
    };
    type_scale: Record<string, string>;
    typographic_rules: string[];
  };
  spatial_principles: {
    grid: string;
    white_space: string;
    visual_density: string;
  };
  texture_and_material: {
    primary_surface: string;
    accent_texture: string;
    what_materials_say: string;
  };
  photography_direction: {
    style: string;
    lighting: string;
    subject_treatment: string;
    what_to_avoid: string;
  };
  iconography: {
    style: string;
    weight: string;
    character: string;
  };
  visual_keywords: string[];
  visual_anti_keywords: string[];
  moodboard_description: string;
}

export interface V2ApplicationScenario {
  context: string;
  description: string;
  visual_direction: string;
}

export interface V2Integration {
  brand_story: {
    headline: string;
    narrative: string;
    arc: string;
  };
  system_coherence_notes: string;
  application_scenarios: V2ApplicationScenario[];
  brand_dos: string[];
  brand_donts: string[];
  evolution_notes: string;
  brand_in_culture: string;
}

// ─── CORE BRAND SYSTEM ────────────────────────────────────────────────────────

export interface BrandSystem {
  id?: number;
  name: string;
  uid?: string;
  timestamp?: number;
  sense: string;
  vesselImageUrl?: string;
  foundation: {
    purpose: string;
    marketWedge: string;
    archetype: string;
    customerPsychology: string;
    positioning: string;
    designPrinciples: string[];
    story: string;
  };
  voice: {
    personalityTraits: string[];
    tone: string;
    tagline: string;
    messagingPillars: string[];
    verbalSignature: string;
  };
  logoSystem: {
    primaryLogoSvg: string;
    symbolOnlySvg: string;
    wordmarkOnlySvg: string;
    logic: string;
    metaphor: string;
    kineticLogic: string;
    dalleLogos?: DalleLogo[];
  };
  colors: {
    primary: ColorInfo;
    secondary: ColorInfo;
    accent: ColorInfo;
    canvasColor: string;
  };
  typography: {
    move: string;
    hierarchy: {
      headline: TypographyRole;
      body: TypographyRole;
      subheadline: TypographyRole;
      caption: TypographyRole;
    };
    typographicRules?: string[];
    rationale_headline?: string;
    rationale_body?: string;
  };
  visualLanguage: {
    shapes: string;
    textureStyle: string;
    geometry: string;
  };
  applications: {
    packaging: string;
    website: string;
  };
  imagery?: {
    lighting: string;
  };
  // V2 pipeline extended fields — only present on v2 generations
  v2Strategy?: V2Strategy;
  v2Verbal?: V2Verbal;
  v2Visual?: V2Visual;
  v2Integration?: V2Integration;
  // V3 pipeline fields — only present on v3 generations
  isV3?: boolean;
  v3Strategy?: V3Strategy;
  v3Names?: V3Names;
  v3Visual?: V3Visual;
  v3Integration?: V3Integration;
  // Refinement tracking
  refinement_count?: number;
  // Mockup templates
  mockups?: Mockup[];
  socialTemplates?: SocialTemplate[];
}

export interface BrandAuditReport {
  systemRecap: string;
  overallVerdict: string;
  realityCheck: string;
  maturity: {
    level: MaturityLevel;
    label: string;
    classification: BrandClassification;
  };
  pillars: {
    purpose: PillarAudit;
    positioning: PillarAudit;
    visualSystem: PillarAudit;
    verbalSystem: PillarAudit;
    experience: PillarAudit;
    governance: PillarAudit;
  };
  litmusTest: LitmusResult[];
  actionItems: string[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  generations_count?: number;
  plan?: string;
}

// V2 input types for the form
export interface V2BrandInput {
  essence: string;
  product_vessel: string;
  theme?: string;
  style_direction?: string;
  target_description?: string;
  category?: string;
  geography?: string;
}

// ─── V3 PIPELINE TYPES ────────────────────────────────────────────────────────

export type BrandVibe = 'Bold' | 'Clean' | 'Warm' | 'Raw' | 'Future';

export interface V3BrandInput {
  brand_idea: string;
  product: string;
  audience: string;
  vibe: BrandVibe;
}

export interface V3Strategy {
  archetype: string;
  archetype_why: string;
  positioning: string;
  audience: string;
  promise: string;
  tensions: string[];
}

export interface V3NameCandidate {
  name: string;
  origin: string;
  domain_available: boolean;
}

export interface V3Names {
  candidates: V3NameCandidate[];
  winner: string;
  winner_reason: string;
}

export interface V3Color {
  creative_name: string;
  hex: string;
  why: string;
}

export interface V3LogoConcept {
  metaphor: string;
  construction: string;
  negative_space_idea: string;
  concept_summary: string;
}

export interface V3Visual {
  colors: V3Color[];
  headline_font: string;
  body_font: string;
  font_pairing_why: string;
  logo_concept: V3LogoConcept;
}

export interface V3Integration {
  story: string[];
  voice_examples: string[];
  applications: string[];
  dos: string[];
  donts: string[];
}

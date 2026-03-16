package server

import (
	"database/sql"
	"net/http"
)

// EducationMoment represents a single educational content piece
type EducationMoment struct {
	ID       int64  `json:"id"`
	Context  string `json:"context"`
	Category string `json:"category"`
	Content  string `json:"content"`
	Source   string `json:"source,omitempty"`
}

// seedEducationMoments inserts education content if the table is empty.
func seedEducationMoments(db *sql.DB) error {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM education_moments").Scan(&count)
	if count > 0 {
		return nil // Already seeded
	}

	moments := []EducationMoment{
		// ── Field Hints ────────────────────────────────────────────────────────
		{
			Context:  "field_hint",
			Category: "strategy",
			Content:  "This isn't a tagline — it's your brand's reason to exist. Nike's was 'every athlete deserves great gear.' Apple's was 'technology for the rest of us.' What belief drives yours?",
			Source:   "field=brand_idea",
		},
		{
			Context:  "field_hint",
			Category: "strategy",
			Content:  "Be specific. 'Clothing' tells us nothing. 'Premium compression activewear for competitive athletes' tells us everything. Specificity is what separates generic from iconic.",
			Source:   "field=product",
		},
		{
			Context:  "field_hint",
			Category: "strategy",
			Content:  "The tighter you define this, the sharper everything gets. 'Everyone' is a death sentence for brands. 'Urban Indian men, 25–35, who treat fitness as identity' — that builds something real.",
			Source:   "field=audience",
		},
		{
			Context:  "field_hint",
			Category: "strategy",
			Content:  "Your vibe isn't decoration — it's a promise. Bold brands can't whisper. Clean brands can't shout. Pick the one your audience already expects.",
			Source:   "field=vibe",
		},
		{
			Context:  "field_hint",
			Category: "naming",
			Content:  "The best brand names are short, ownable, and say something without saying everything. 'Amazon' implies scale. 'Slack' implies ease. What does yours imply?",
			Source:   "field=brand_name",
		},
		{
			Context:  "field_hint",
			Category: "strategy",
			Content:  "Your category shapes your competition. Define it too broadly and you're fighting everyone. Too narrowly and nobody finds you. Find the specific territory you can own.",
			Source:   "field=category",
		},
		{
			Context:  "field_hint",
			Category: "color",
			Content:  "Color is your fastest communication. Before anyone reads a word, they've already felt something. Red says urgency. Blue says trust. Green says growth. What should they feel first?",
			Source:   "field=color_preference",
		},
		{
			Context:  "field_hint",
			Category: "typography",
			Content:  "Type is voice made visible. A serif font whispers heritage. A geometric sans-serif announces modernity. Script says personal. Mono says precision. Pick the voice that matches yours.",
			Source:   "field=typography_style",
		},

		// ── Loading Tips ───────────────────────────────────────────────────────
		{
			Context:  "loading_tip",
			Category: "logo",
			Content:  "The Nike Swoosh cost $35. Carolyn Davidson was a design student. Phil Knight said, 'I don't love it, but it'll grow on me.' It grew into a $50 billion symbol.",
		},
		{
			Context:  "loading_tip",
			Category: "logo",
			Content:  "FedEx tested over 400 logo versions across 9 months. The hidden arrow between E and x? Never in the brief — it emerged from obsessive typographic refinement.",
		},
		{
			Context:  "loading_tip",
			Category: "color",
			Content:  "Color increases brand recognition by up to 80%. That's not preference — that's neuroscience.",
			Source:   "University of Loyola study",
		},
		{
			Context:  "loading_tip",
			Category: "logo",
			Content:  "Paul Rand charged Steve Jobs $100,000 for one logo concept. When Jobs asked for options, Rand said: 'I will solve your problem. You don't have to use the solution.'",
		},
		{
			Context:  "loading_tip",
			Category: "strategy",
			Content:  "The world's most valuable brand (Apple, ~$503B) has used essentially the same logo since 1977. Consistency compounds.",
		},
		{
			Context:  "loading_tip",
			Category: "naming",
			Content:  "Coca-Cola's Spencerian script was chosen in 1886 because it was distinctive — not because it was beautiful. The first rule of naming: own your territory.",
		},
		{
			Context:  "loading_tip",
			Category: "strategy",
			Content:  "Brand value of the top 100 global brands is $3.5 trillion. That's not products — that's meaning.",
		},
		{
			Context:  "loading_tip",
			Category: "logo",
			Content:  "Airbnb's Bélo symbol was designed to be drawn by anyone, anywhere. It encodes four concepts: people, place, love, and the letter A.",
		},
		{
			Context:  "loading_tip",
			Category: "color",
			Content:  "Tiffany Blue (Pantone 1837) is trademarked. The '1837' is the year Tiffany was founded. A single color — no logo, no words — communicates $10,000 instantly.",
		},
		{
			Context:  "loading_tip",
			Category: "typography",
			Content:  "Helvetica is used by American Airlines, BMW, Lufthansa, and the New York subway. One typeface, four radically different brands. Execution — not just font choice — makes the difference.",
		},
		{
			Context:  "loading_tip",
			Category: "naming",
			Content:  "Google was a typo. The founders misspelled 'googol' (10 to the 100th power) in their domain registration. The accident became the most visited site on earth.",
		},
		{
			Context:  "loading_tip",
			Category: "strategy",
			Content:  "Harley-Davidson customers tattoo the logo on their bodies. That's not brand loyalty — that's brand identity. The goal: become part of who someone is, not just what they buy.",
		},
		{
			Context:  "loading_tip",
			Category: "strategy",
			Content:  "In a Yale study, 80% of people could identify Coca-Cola's red can in under 0.1 seconds — before they could read the label. Your brand's first job is recognition, not explanation.",
		},
		{
			Context:  "loading_tip",
			Category: "logo",
			Content:  "Amazon's logo arrow starts at 'a' and ends at 'z' — signifying everything from A to Z, and a smile. Three ideas encoded in one small curve.",
		},

		// ── Post-Generation ────────────────────────────────────────────────────
		{
			Context:  "post_generation",
			Category: "naming",
			Content:  "Your brand names are coined — invented words that don't exist in any language. This means zero trademark conflicts, available domains, and a name that belongs only to you.",
		},
		{
			Context:  "post_generation",
			Category: "color",
			Content:  "These colors weren't picked randomly. Each was chosen to evoke your brand's vibe and stand apart in your category. Studies show 85% of consumers cite color as a primary reason for purchasing.",
		},
		{
			Context:  "post_generation",
			Category: "strategy",
			Content:  "Your brand strategy is the invisible architecture everything else is built on. Without it, a logo is just a picture. With it, every element has a reason.",
		},
		{
			Context:  "post_generation",
			Category: "typography",
			Content:  "Typography carries emotion before a single word is read. Serif fonts signal tradition and authority. Sans-serif signals modernity and clarity. Your pairing was chosen to match your brand's personality.",
		},
		{
			Context:  "post_generation",
			Category: "logo",
			Content:  "Your logo works at every scale — from a favicon to a billboard. The best logos are simple enough to be remembered after a single glance and flexible enough to live anywhere.",
		},
		{
			Context:  "post_generation",
			Category: "architecture",
			Content:  "Every great brand has a hierarchy. Master brand, sub-brands, product lines — each with its own role but unified by a shared identity system. This is the skeleton everything hangs on.",
		},

		// ── Between Screens ────────────────────────────────────────────────────
		{
			Context:  "between_screens",
			Category: "strategy",
			Content:  "Jeff Bezos: 'Your brand is what people say about you when you're not in the room.' What do you want them to say?",
		},
		{
			Context:  "between_screens",
			Category: "strategy",
			Content:  "Marty Neumeier: 'A brand is not what you say it is. It's what they say it is.' The gap between intention and perception — that's where branding happens.",
		},
		{
			Context:  "between_screens",
			Category: "naming",
			Content:  "The ideal brand name is one syllable shorter than it needs to be. IKEA, Nike, Zara, Muji. Brevity is memory. Memory is market share.",
		},
		{
			Context:  "between_screens",
			Category: "color",
			Content:  "Red: urgency, energy, passion. Blue: trust, calm, intelligence. Yellow: optimism, clarity, warmth. Green: growth, health, nature. Black: luxury, authority, sophistication. Choose deliberately.",
		},
		{
			Context:  "between_screens",
			Category: "logo",
			Content:  "A logo is not a brand — it's a trigger. It only has meaning because of the experiences, emotions, and memories it's connected to. Build the meaning first. The logo will carry it.",
		},
		{
			Context:  "between_screens",
			Category: "architecture",
			Content:  "The world's strongest brand architectures follow one rule: clarity over cleverness. Apple's products all say 'i' or 'Mac.' Google's services all feel like Google. Coherence scales. Confusion doesn't.",
		},
		{
			Context:  "between_screens",
			Category: "typography",
			Content:  "In 2012, IKEA switched from Futura to Verdana. The internet erupted. No product changed. No price changed. Type is that powerful — it carries the entire personality of a brand.",
		},
	}

	stmt, err := db.Prepare("INSERT INTO education_moments (context, category, content, source) VALUES (?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, m := range moments {
		if _, err := stmt.Exec(m.Context, m.Category, m.Content, m.Source); err != nil {
			return err
		}
	}
	return nil
}

// GET /api/education/tip?context=loading_tip
// Returns a random education moment for the given context.
func (s *Server) handleEducationTip(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	ctx := r.URL.Query().Get("context")
	if ctx == "" {
		ctx = "loading_tip"
	}

	var m EducationMoment
	err := s.db.QueryRow(`
		SELECT id, context, category, content, COALESCE(source, '')
		FROM education_moments
		WHERE context = ?
		ORDER BY RANDOM()
		LIMIT 1
	`, ctx).Scan(&m.ID, &m.Context, &m.Category, &m.Content, &m.Source)

	if err == sql.ErrNoRows {
		writeError(w, 404, "No education moments found for context")
		return
	}
	if err != nil {
		writeError(w, 500, "Database error")
		return
	}

	writeJSON(w, 200, m)
}

// GET /api/education/hint?field=brand_idea
// Returns a field-specific hint (stored as source=field=<name>).
func (s *Server) handleEducationHint(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}

	field := r.URL.Query().Get("field")
	if field == "" {
		writeError(w, 400, "field parameter required")
		return
	}

	source := "field=" + field

	var m EducationMoment
	err := s.db.QueryRow(`
		SELECT id, context, category, content, COALESCE(source, '')
		FROM education_moments
		WHERE context = 'field_hint' AND source = ?
		ORDER BY RANDOM()
		LIMIT 1
	`, source).Scan(&m.ID, &m.Context, &m.Category, &m.Content, &m.Source)

	if err == sql.ErrNoRows {
		// Fallback: return any field hint
		err = s.db.QueryRow(`
			SELECT id, context, category, content, COALESCE(source, '')
			FROM education_moments
			WHERE context = 'field_hint'
			ORDER BY RANDOM()
			LIMIT 1
		`).Scan(&m.ID, &m.Context, &m.Category, &m.Content, &m.Source)
	}

	if err == sql.ErrNoRows {
		writeError(w, 404, "No hint found")
		return
	}
	if err != nil {
		writeError(w, 500, "Database error")
		return
	}

	writeJSON(w, 200, m)
}

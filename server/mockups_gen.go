package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// ─── HTML MOCKUP GENERATORS ────────────────────────────────────────────────────
// These endpoints return standalone HTML pages styled with the brand's
// colors, fonts, and identity — ready to preview in an iframe or open in a tab.

// brandDataForMockup extracts the key brand fields needed for mockups.
type mockupBrandData struct {
	Name         string
	Tagline      string
	PrimaryHex   string
	SecondaryHex string
	AccentHex    string
	HeadlineFont string
	BodyFont     string
	Initial      string
}

func extractMockupBrandData(brandName string, dataStr string) mockupBrandData {
	bd := mockupBrandData{
		Name:         brandName,
		PrimaryHex:   "#f17022",
		SecondaryHex: "#1a1a1a",
		AccentHex:    "#f5f5f5",
		HeadlineFont: "Georgia",
		BodyFont:     "Helvetica Neue",
	}

	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(dataStr), &raw); err != nil {
		return bd
	}

	gs := func(m map[string]interface{}, key string) string {
		if m == nil {
			return ""
		}
		if v, ok := m[key]; ok {
			return fmt.Sprintf("%v", v)
		}
		return ""
	}
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

	// Look in guided_context first
	var gc map[string]interface{}
	if gci, ok := raw["guided_context"]; ok {
		gc, _ = gci.(map[string]interface{})
	}

	// Tagline — guided_context.naming > guided_context.assembly > top-level
	if gc != nil {
		if naming := gm(gc, "naming"); naming != nil {
			if t := gs(naming, "tagline"); t != "" {
				bd.Tagline = t
			}
		}
		if bd.Tagline == "" {
			if assembly := gm(gc, "assembly"); assembly != nil {
				if t := gs(assembly, "tagline"); t != "" {
					bd.Tagline = t
				}
			}
		}
	}
	if bd.Tagline == "" {
		bd.Tagline = gs(raw, "tagline")
	}

	// Colors
	var colorsData map[string]interface{}
	if gc != nil {
		colorsData = gm(gc, "colors")
	}
	if colorsData == nil {
		if visual, ok := raw["visual"].(map[string]interface{}); ok {
			colorsData = visual
		}
	}

	// Try to extract colors list from guided_context.colors.colors
	if colorsData != nil {
		if cl, ok := colorsData["colors"].([]interface{}); ok && len(cl) > 0 {
			if c0, ok := cl[0].(map[string]interface{}); ok {
				if h := gs(c0, "hex"); h != "" {
					bd.PrimaryHex = h
				}
			}
			if len(cl) > 1 {
				if c1, ok := cl[1].(map[string]interface{}); ok {
					if h := gs(c1, "hex"); h != "" {
						bd.SecondaryHex = h
					}
				}
			}
			if len(cl) > 2 {
				if c2, ok := cl[2].(map[string]interface{}); ok {
					if h := gs(c2, "hex"); h != "" {
						bd.AccentHex = h
					}
				}
			}
		}
	}

	// Try colors from brand.colors.primary/secondary/accent (BrandSystem format)
	if colors, ok := raw["colors"].(map[string]interface{}); ok {
		if pri := gm(colors, "primary"); pri != nil {
			if h := gs(pri, "hex"); h != "" {
				bd.PrimaryHex = h
			}
		}
		if sec := gm(colors, "secondary"); sec != nil {
			if h := gs(sec, "hex"); h != "" {
				bd.SecondaryHex = h
			}
		}
		if acc := gm(colors, "accent"); acc != nil {
			if h := gs(acc, "hex"); h != "" {
				bd.AccentHex = h
			}
		}
	}

	// Typography
	var typData map[string]interface{}
	if gc != nil {
		typData = gm(gc, "typography")
	}
	if typData == nil {
		typData, _ = raw["visual"].(map[string]interface{})
	}
	if typData == nil {
		if typ, ok := raw["typography"].(map[string]interface{}); ok {
			typData = typ
		}
	}

	if typData != nil {
		if hf := gs(typData, "headline_font"); hf != "" {
			bd.HeadlineFont = hf
		}
		if bf := gs(typData, "body_font"); bf != "" {
			bd.BodyFont = bf
		}
		// BrandSystem typography.hierarchy.headline.fontFamily
		if hier, ok := typData["hierarchy"].(map[string]interface{}); ok {
			if head := gm(hier, "headline"); head != nil {
				if ff := gs(head, "fontFamily"); ff != "" {
					bd.HeadlineFont = ff
				}
			}
			if body := gm(hier, "body"); body != nil {
				if ff := gs(body, "fontFamily"); ff != "" {
					bd.BodyFont = ff
				}
			}
		}
	}

	// Compute initial
	if len(brandName) > 0 {
		r := []rune(brandName)
		bd.Initial = strings.ToUpper(string(r[0:1]))
	}

	return bd
}

// googleFontURL returns the Google Fonts URL for the two given fonts
func googleFontURL(headline, body string) string {
	h := strings.ReplaceAll(headline, " ", "+")
	b := strings.ReplaceAll(body, " ", "+")
	return fmt.Sprintf("https://fonts.googleapis.com/css2?family=%s:wght@400;700;900&family=%s:wght@300;400;600&display=swap", h, b)
}

// ─── BUSINESS CARD MOCKUP ─────────────────────────────────────────────────────

func renderBusinessCardMockup(b mockupBrandData) string {
	domain := sanitizeDomain(b.Name)
	taglineShort := b.Tagline
	if len([]rune(taglineShort)) > 55 {
		runes := []rune(taglineShort)
		taglineShort = string(runes[:52]) + "..."
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>%s — Business Card Mockup</title>
<link href="%s" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%%;
  min-height: 100%%;
  background: #141414;
  background-image: radial-gradient(circle at 30%% 50%%, rgba(255,255,255,0.02) 0%%, transparent 60%%),
    radial-gradient(circle at 70%% 50%%, rgba(255,255,255,0.015) 0%%, transparent 60%%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 56px;
  padding: 56px 20px;
  font-family: 'Inter', sans-serif;
}
.card-pair {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.label {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.6em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.18);
  text-align: center;
}
/* Card wrapper — 3D perspective */
.card-wrap {
  perspective: 800px;
}
/* 3.5" x 2" ratio = 1.75:1 → at 360px wide = 205px tall */
.card {
  width: 360px;
  height: 205px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-wrap:hover .card {
  transform: rotateY(-4deg) rotateX(2deg) translateY(-4px);
  box-shadow: 28px 32px 80px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.06) !important;
}
/* FRONT */
.card-front {
  background: #0d0d0d;
  background-image:
    linear-gradient(135deg, rgba(255,255,255,0.02) 0%%, transparent 60%%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 8px,
      rgba(255,255,255,0.008) 8px,
      rgba(255,255,255,0.008) 9px
    );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px 24px 20px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06);
}
.card-front::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, %s, %s88);
}
.card-front-initial-bg {
  position: absolute;
  right: -8px;
  top: 50%%;
  transform: translateY(-50%%);
  font-family: '%s', Georgia, serif;
  font-size: 120px;
  font-weight: 900;
  color: %s;
  opacity: 0.04;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  letter-spacing: -0.05em;
}
.card-front-brand {
  font-family: '%s', Georgia, serif;
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02em;
  padding-left: 10px;
  position: relative;
  z-index: 1;
}
.card-front-tagline {
  font-size: 9.5px;
  color: rgba(255,255,255,0.38);
  font-style: italic;
  padding-left: 10px;
  margin-top: 5px;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}
.card-front-bottom {
  position: relative;
  z-index: 1;
}
.card-front-divider {
  height: 1px;
  background: linear-gradient(to right, rgba(255,255,255,0.07), transparent);
  margin: 0 0 10px 10px;
}
.card-front-contact {
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.card-front-contact span {
  font-size: 8.5px;
  color: rgba(255,255,255,0.28);
  letter-spacing: 0.04em;
}
.card-front-dot {
  position: absolute;
  bottom: 18px;
  right: 20px;
  width: 8px;
  height: 8px;
  border-radius: 50%%;
  background: %s;
  opacity: 0.5;
  box-shadow: 0 0 8px %s;
}
/* BACK */
.card-back {
  background: %s;
  background-image: linear-gradient(135deg, rgba(255,255,255,0.08) 0%%, rgba(0,0,0,0.15) 100%%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.08);
  position: relative;
  overflow: hidden;
}
.card-back::before {
  content: '%s';
  position: absolute;
  font-family: '%s', Georgia, serif;
  font-size: 160px;
  font-weight: 900;
  color: rgba(255,255,255,0.05);
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
.card-back-mark {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(4px);
}
.card-back-name {
  font-family: '%s', Georgia, serif;
  font-size: 14px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
  position: relative;
  z-index: 1;
}
.card-back-divider {
  width: 32px;
  height: 1px;
  background: rgba(255,255,255,0.25);
  position: relative;
  z-index: 1;
}
.card-back-contact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  position: relative;
  z-index: 1;
}
.card-back-contact span {
  font-size: 8px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.1em;
}
@media print {
  html, body { background: #1a1a1a !important; padding: 20px !important; }
  .card { box-shadow: none !important; }
  .card-wrap:hover .card { transform: none !important; }
}
</style>
</head>
<body>
<div class="card-pair">
  <div class="label">Front</div>
  <div class="card-wrap">
    <div class="card card-front">
      <div class="card-front-initial-bg">%s</div>
      <div>
        <div class="card-front-brand">%s</div>
        <div class="card-front-tagline">%s</div>
      </div>
      <div class="card-front-bottom">
        <div class="card-front-divider"></div>
        <div class="card-front-contact">
          <span>hello@%s.com</span>
          <span>+91 98765 43210</span>
          <span>www.%s.com</span>
        </div>
      </div>
      <div class="card-front-dot"></div>
    </div>
  </div>
</div>
<div class="card-pair">
  <div class="label">Back</div>
  <div class="card-wrap">
    <div class="card card-back">
      <div class="card-back-mark">%s</div>
      <div class="card-back-name">%s</div>
      <div class="card-back-divider"></div>
      <div class="card-back-contact">
        <span>hello@%s.com</span>
        <span>%s.com</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.PrimaryHex, b.PrimaryHex,  // left accent bar gradient
		b.HeadlineFont,               // large bg initial font
		b.PrimaryHex,                 // large bg initial color
		b.HeadlineFont,               // brand name font
		b.PrimaryHex, b.PrimaryHex,  // dot color + glow
		b.PrimaryHex,                 // card back bg
		htmlEsc(b.Initial),           // back ::before watermark text
		b.HeadlineFont,               // back ::before watermark font
		b.HeadlineFont,               // back mark font
		b.HeadlineFont,               // back name font
		// Template vars
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
		htmlEsc(taglineShort),
		domain, domain,
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
		domain,
		domain,
	)
}

// ─── SOCIAL MEDIA PROFILE MOCKUP ──────────────────────────────────────────────

func renderSocialMockup(b mockupBrandData) string {
	taglineShort := b.Tagline
	if len([]rune(taglineShort)) > 80 {
		runes := []rune(taglineShort)
		taglineShort = string(runes[:77]) + "..."
	}
	handle := strings.ToLower(strings.ReplaceAll(b.Name, " ", ""))

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>%s — Social Profile Mockup</title>
<link href="%s" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%%;
  min-height: 100vh;
  background: linear-gradient(135deg, #e8e8e8 0%%, #d0d0d0 100%%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px 60px;
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
}
.phone-frame {
  width: 375px;
  background: #fff;
  border-radius: 48px;
  overflow: hidden;
  box-shadow:
    0 40px 100px rgba(0,0,0,0.3),
    0 8px 32px rgba(0,0,0,0.15),
    inset 0 0 0 1px rgba(255,255,255,0.9),
    inset 0 0 0 2px rgba(0,0,0,0.1);
  position: relative;
}
/* Dynamic island pill */
.phone-island {
  position: absolute;
  top: 12px; left: 50%%;
  transform: translateX(-50%%);
  width: 90px; height: 26px;
  background: #111;
  border-radius: 20px;
  z-index: 20;
}
.screen {
  padding-top: 48px;
  background: #fafafa;
}
/* Instagram-style top nav */
.ig-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  background: #fafafa;
  border-bottom: 0.5px solid #e0e0e0;
}
.ig-nav-title {
  font-size: 16px;
  font-weight: 700;
  color: #0a0a0a;
  letter-spacing: -0.02em;
}
.ig-nav-icons {
  display: flex;
  gap: 16px;
  font-size: 18px;
}
/* Profile section */
.profile-section {
  padding: 16px 16px 0;
  background: #fafafa;
}
.profile-top-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
}
.profile-pic-ring {
  width: 84px; height: 84px;
  border-radius: 50%%;
  background: linear-gradient(45deg, %s, %s, %s);
  padding: 3px;
  flex-shrink: 0;
}
.profile-pic {
  width: 100%%; height: 100%%;
  border-radius: 50%%;
  background: %s;
  border: 3px solid #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 26px;
  font-weight: 900;
  color: #fff;
}
.profile-stats-row {
  display: flex;
  gap: 12px;
  flex: 1;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.stat-num {
  font-size: 16px;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.1;
}
.stat-label {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}
.profile-name {
  font-size: 13px;
  font-weight: 700;
  color: #0a0a0a;
  margin-bottom: 2px;
}
.profile-handle-row {
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
}
.profile-bio {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  font-style: italic;
  margin-bottom: 3px;
}
.profile-link {
  font-size: 12px;
  color: %s;
  font-weight: 600;
  margin-bottom: 12px;
}
/* Action buttons row */
.action-buttons {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}
.btn-follow {
  flex: 1;
  background: %s;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}
.btn-message {
  flex: 1;
  background: transparent;
  color: #0a0a0a;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
.btn-dropdown {
  width: 36px;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #0a0a0a;
}
/* Story highlights */
.highlights-section {
  padding: 0 16px 12px;
  border-bottom: 0.5px solid #e0e0e0;
  background: #fafafa;
}
.highlights-row {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}
.highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.highlight-ring {
  width: 56px; height: 56px;
  border-radius: 50%%;
  padding: 2px;
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366);
}
.highlight-ring.brand {
  background: linear-gradient(45deg, %s, %s);
}
.highlight-circle {
  width: 100%%; height: 100%%;
  border-radius: 50%%;
  background: %s;
  border: 2.5px solid #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.highlight-label {
  font-size: 10px;
  color: #0a0a0a;
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Grid tabs */
.grid-tabs {
  display: flex;
  border-bottom: 0.5px solid #e0e0e0;
  background: #fafafa;
}
.grid-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  font-size: 18px;
  border-bottom: 1px solid transparent;
}
.grid-tab.active {
  border-bottom-color: #0a0a0a;
}
/* Posts grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: #e0e0e0;
}
.post {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.post-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 9px;
  font-weight: 900;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.post-1 { background: %s; }
.post-2 { background: %s; }
.post-3 { background: %s; }
.post-4 { background: linear-gradient(135deg, %s, %s); }
.post-5 { background: %s; opacity: 0.7; }
.post-6 { background: %s; opacity: 0.85; }
/* IG bottom nav */
.ig-bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 0 6px;
  background: #fafafa;
  border-top: 0.5px solid #e0e0e0;
  font-size: 20px;
}
.home-bar {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.home-indicator {
  width: 100px;
  height: 4px;
  background: #222;
  border-radius: 2px;
  opacity: 0.7;
}
@media (max-width: 420px) {
  .phone-frame { width: 100%%; border-radius: 24px; }
}
</style>
</head>
<body>
<div class="phone-frame">
  <div class="phone-island"></div>
  <div class="screen">
    <!-- IG nav -->
    <div class="ig-nav">
      <div class="ig-nav-title">@%s</div>
      <div class="ig-nav-icons">
        <span>+</span>
        <span>≡</span>
      </div>
    </div>
    <!-- Profile section -->
    <div class="profile-section">
      <div class="profile-top-row">
        <div class="profile-pic-ring">
          <div class="profile-pic">%s</div>
        </div>
        <div class="profile-stats-row">
          <div class="stat"><div class="stat-num">47</div><div class="stat-label">Posts</div></div>
          <div class="stat"><div class="stat-num">1.2K</div><div class="stat-label">Followers</div></div>
          <div class="stat"><div class="stat-num">156</div><div class="stat-label">Following</div></div>
        </div>
      </div>
      <div class="profile-name">%s</div>
      <div class="profile-handle-row">Brand · Design · Identity</div>
      %s
      <div class="profile-link">%s.com ↗</div>
      <div class="action-buttons">
        <div class="btn-follow">Follow</div>
        <div class="btn-message">Message</div>
        <div class="btn-dropdown">▾</div>
      </div>
    </div>
    <!-- Story Highlights -->
    <div class="highlights-section">
      <div class="highlights-row">
        <div class="highlight">
          <div class="highlight-ring brand"><div class="highlight-circle">✦</div></div>
          <div class="highlight-label">Brand</div>
        </div>
        <div class="highlight">
          <div class="highlight-ring brand"><div class="highlight-circle">◈</div></div>
          <div class="highlight-label">Story</div>
        </div>
        <div class="highlight">
          <div class="highlight-ring brand"><div class="highlight-circle">◉</div></div>
          <div class="highlight-label">Work</div>
        </div>
        <div class="highlight">
          <div class="highlight-ring"><div class="highlight-circle">⊹</div></div>
          <div class="highlight-label">More</div>
        </div>
      </div>
    </div>
    <!-- Grid tabs -->
    <div class="grid-tabs">
      <div class="grid-tab active">⊞</div>
      <div class="grid-tab">☰</div>
      <div class="grid-tab">♡</div>
    </div>
    <!-- Posts grid -->
    <div class="posts-grid">
      <div class="post post-1"><div class="post-inner">%s</div></div>
      <div class="post post-2"><div class="post-inner">%s</div></div>
      <div class="post post-3"><div class="post-inner">%s</div></div>
      <div class="post post-4"><div class="post-inner">%s</div></div>
      <div class="post post-5"><div class="post-inner">%s</div></div>
      <div class="post post-6"><div class="post-inner">%s</div></div>
    </div>
    <!-- IG bottom nav -->
    <div class="ig-bottom-nav">
      <span>⌂</span>
      <span>⊕</span>
      <span>▷</span>
      <span>♡</span>
      <span style="width:24px;height:24px;border-radius:50%%;background:%s;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;">%s</span>
    </div>
    <div class="home-bar">
      <div class="home-indicator"></div>
    </div>
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.PrimaryHex, b.SecondaryHex, b.AccentHex, // gradient ring
		b.PrimaryHex,   // profile pic bg
		b.HeadlineFont, // profile pic font
		b.PrimaryHex,   // link color
		b.PrimaryHex,   // follow button
		b.PrimaryHex, b.SecondaryHex, // highlight ring gradient
		b.SecondaryHex, // highlight circle bg
		b.HeadlineFont, // post font
		b.PrimaryHex,                 // post 1
		b.SecondaryHex,               // post 2
		b.AccentHex,                  // post 3
		b.PrimaryHex, b.SecondaryHex, // post 4 gradient
		b.AccentHex,   // post 5
		b.PrimaryHex,  // post 6
		// Template vars
		htmlEsc(handle),
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
		func() string {
			if taglineShort != "" {
				return fmt.Sprintf(`<div class="profile-bio">%s</div>`, htmlEsc(taglineShort))
			}
			return ""
		}(),
		htmlEsc(handle),
		// Grid posts
		htmlEsc(b.Name),
		htmlEsc(b.Name),
		htmlEsc(b.Name),
		htmlEsc(b.Name),
		htmlEsc(b.Name),
		htmlEsc(b.Name),
		// Bottom nav avatar
		b.PrimaryHex,
		htmlEsc(b.Initial),
	)
}

// ─── LETTERHEAD MOCKUP ────────────────────────────────────────────────────────

func renderLetterheadMockup(b mockupBrandData) string {
	nameUpper := strings.ToUpper(b.Name)
	domain := sanitizeDomain(b.Name)

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>%s — Letterhead Mockup</title>
<link href="%s" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%%;
  min-height: 100vh;
  background: linear-gradient(135deg, #ddd 0%%, #c8c8c8 100%%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px 60px;
  font-family: '%s', 'Helvetica Neue', Helvetica, sans-serif;
}
.paper {
  width: 100%%;
  max-width: 640px;
  min-height: 900px;
  background: #fff;
  box-shadow:
    0 4px 6px rgba(0,0,0,0.05),
    0 20px 60px rgba(0,0,0,0.18),
    0 40px 80px rgba(0,0,0,0.08);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
/* Watermark */
.lh-watermark {
  position: absolute;
  top: 50%%;
  left: 50%%;
  transform: translate(-50%%, -50%%);
  font-family: '%s', Georgia, serif;
  font-size: 280px;
  font-weight: 900;
  color: %s;
  opacity: 0.04;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  letter-spacing: -0.05em;
}
/* Header */
.lh-header {
  background: %s;
  background-image: linear-gradient(135deg, %s 0%%, %s 100%%);
  padding: 28px 40px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}
.lh-header-left {
  display: flex;
  flex-direction: column;
}
.lh-brand {
  font-family: '%s', Georgia, serif;
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.lh-tagline {
  font-size: 9.5px;
  color: rgba(255,255,255,0.6);
  margin-top: 5px;
  font-style: italic;
  letter-spacing: 0.04em;
}
.lh-header-right {
  text-align: right;
}
.lh-contact-line {
  font-size: 8.5px;
  color: rgba(255,255,255,0.65);
  line-height: 1.8;
  letter-spacing: 0.05em;
}
/* Sub-header gradient bar */
.lh-subheader {
  height: 3px;
  background: linear-gradient(to right, %s, %s88, transparent);
  position: relative;
  z-index: 1;
}
/* Body area */
.lh-body {
  flex: 1;
  padding: 44px 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: relative;
  z-index: 1;
}
.lh-date {
  font-size: 8.5px;
  color: #aaa;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
.lh-ref-line {
  font-size: 8.5px;
  color: #bbb;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: -12px;
}
.lh-to {
  font-size: 11px;
  color: #444;
  line-height: 1.7;
  margin-top: 8px;
}
.lh-salutation {
  font-size: 12px;
  color: #333;
  font-style: italic;
  font-family: Georgia, serif;
  margin-top: -4px;
}
.lh-subject {
  font-size: 10px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-left: 3px solid %s;
  padding: 6px 0 6px 12px;
  background: rgba(0,0,0,0.015);
}
/* Placeholder text lines */
.lh-text-block {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.lh-line {
  height: 1.5px;
  background: linear-gradient(to right, #ececec, #f5f5f5);
  border-radius: 1px;
}
.lh-line.full { width: 100%%; }
.lh-line.long { width: 88%%; }
.lh-line.mid { width: 72%%; }
.lh-line.short { width: 50%%; }
.lh-para-gap {
  height: 6px;
}
.lh-signature-area {
  margin-top: 16px;
}
.lh-sign-closing {
  font-size: 10px;
  color: #999;
  margin-bottom: 28px;
  font-style: italic;
  font-family: Georgia, serif;
}
.lh-sign-line {
  width: 150px;
  height: 1px;
  background: #ccc;
  margin-bottom: 8px;
}
.lh-sign-name {
  font-size: 9px;
  font-weight: 700;
  color: #444;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lh-sign-title {
  font-size: 8px;
  color: #bbb;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 3px;
}
/* Footer */
.lh-footer-line {
  height: 2px;
  background: %s;
  position: relative;
  z-index: 1;
}
.lh-footer {
  background: %s;
  padding: 14px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}
.lh-footer-left {
  font-size: 8px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.1em;
}
.lh-footer-center {
  font-size: 8px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.06em;
  font-style: italic;
}
.lh-footer-right {
  font-size: 8px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.1em;
}
@media print {
  html, body { background: #fff !important; padding: 0 !important; }
  .paper { box-shadow: none !important; min-height: 100vh; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
@media (max-width: 480px) {
  .paper { min-height: unset; }
  .lh-header { flex-direction: column; gap: 14px; }
  .lh-header-right { text-align: left; }
}
</style>
</head>
<body>
<div class="paper">
  <!-- Watermark -->
  <div class="lh-watermark">%s</div>
  <!-- Header -->
  <div class="lh-header">
    <div class="lh-header-left">
      <div class="lh-brand">%s</div>
      %s
    </div>
    <div class="lh-header-right">
      <div class="lh-contact-line">hello@%s.com</div>
      <div class="lh-contact-line">www.%s.com</div>
      <div class="lh-contact-line">+91 98765 43210</div>
      <div class="lh-contact-line">123 Brand Avenue, City 000000</div>
    </div>
  </div>
  <div class="lh-subheader"></div>

  <!-- Body -->
  <div class="lh-body">
    <div class="lh-date">Date: — March —, 2026</div>
    <div class="lh-ref-line">Ref: HI/2026/001</div>
    <div class="lh-to">
      To,<br/>
      The Recipient<br/>
      Organization Name<br/>
      City — 000000
    </div>
    <div class="lh-salutation">Dear Sir / Ma'am,</div>
    <div class="lh-subject">Subject: Brand Communication &amp; Partnership</div>
    <div class="lh-text-block">
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line long"></div>
      <div class="lh-line full"></div>
      <div class="lh-line mid"></div>
    </div>
    <div class="lh-para-gap"></div>
    <div class="lh-text-block">
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line long"></div>
      <div class="lh-line short"></div>
    </div>
    <div class="lh-para-gap"></div>
    <div class="lh-text-block">
      <div class="lh-line long"></div>
      <div class="lh-line full"></div>
      <div class="lh-line mid"></div>
    </div>
    <div class="lh-signature-area">
      <div class="lh-sign-closing">Warm regards,</div>
      <div class="lh-sign-line"></div>
      <div class="lh-sign-name">%s</div>
      <div class="lh-sign-title">Brand Representative</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="lh-footer-line"></div>
  <div class="lh-footer">
    <div class="lh-footer-left">%s.com · hello@%s.com</div>
    <div class="lh-footer-center">Crafted with intention.</div>
    <div class="lh-footer-right">© 2026 %s</div>
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.BodyFont,
		b.HeadlineFont, // watermark font
		b.PrimaryHex,   // watermark color
		b.PrimaryHex,   // header bg
		b.PrimaryHex, b.SecondaryHex, // header gradient
		b.HeadlineFont, // brand name font
		b.PrimaryHex, b.PrimaryHex, // subheader gradient
		b.PrimaryHex,   // subject border
		b.PrimaryHex,   // footer line
		b.PrimaryHex,   // footer bg
		// Template vars
		htmlEsc(b.Initial),
		nameUpper,
		func() string {
			if b.Tagline != "" {
				return fmt.Sprintf(`<div class="lh-tagline">%s</div>`, htmlEsc(b.Tagline))
			}
			return ""
		}(),
		domain, domain,
		nameUpper,
		domain, domain,
		htmlEsc(b.Name),
	)
}

// ─── HTTP HANDLERS ────────────────────────────────────────────────────────────

// GET /api/brands/:id/mockup/business-card
func (s *Server) handleMockupBusinessCard(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}
	brandName, dataStr, err := s.loadBrandForMockup(brandID, userID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}
	bd := extractMockupBrandData(brandName, dataStr)
	html := renderBusinessCardMockup(bd)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Frame-Options", "SAMEORIGIN")
	w.WriteHeader(200)
	w.Write([]byte(html))
}

// GET /api/brands/:id/mockup/social
func (s *Server) handleMockupSocial(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}
	brandName, dataStr, err := s.loadBrandForMockup(brandID, userID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}
	bd := extractMockupBrandData(brandName, dataStr)
	html := renderSocialMockup(bd)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Frame-Options", "SAMEORIGIN")
	w.WriteHeader(200)
	w.Write([]byte(html))
}

// GET /api/brands/:id/mockup/letterhead
func (s *Server) handleMockupLetterhead(w http.ResponseWriter, r *http.Request, brandID string, userID int64) {
	if r.Method != "GET" {
		writeError(w, 405, "Method not allowed")
		return
	}
	brandName, dataStr, err := s.loadBrandForMockup(brandID, userID)
	if err != nil {
		writeError(w, 404, "Brand not found")
		return
	}
	bd := extractMockupBrandData(brandName, dataStr)
	html := renderLetterheadMockup(bd)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Frame-Options", "SAMEORIGIN")
	w.WriteHeader(200)
	w.Write([]byte(html))
}

func (s *Server) loadBrandForMockup(brandID string, userID int64) (string, string, error) {
	var brandName string
	var dataStr string
	err := s.db.QueryRow(
		"SELECT name, brand_data FROM brands WHERE (id = ? OR uid = ?) AND user_id = ?",
		brandID, brandID, userID,
	).Scan(&brandName, &dataStr)
	return brandName, dataStr, err
}

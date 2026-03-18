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
  height: 100%%;
  background: #111;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}
.label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  margin-bottom: 12px;
  text-align: center;
}
.card {
  width: 340px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  position: relative;
}
/* FRONT */
.card-front {
  background: #0d0d0d;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
}
.card-front::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: %s;
}
.card-front-brand {
  font-family: '%s', Georgia, serif;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.03em;
  padding-left: 8px;
}
.card-front-tagline {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  padding-left: 8px;
  margin-top: 4px;
  line-height: 1.4;
}
.card-front-divider {
  height: 1px;
  background: rgba(255,255,255,0.07);
  margin: 12px 0 12px 8px;
}
.card-front-contact {
  padding-left: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.card-front-contact span {
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.04em;
}
.card-front-dot {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 10px;
  height: 10px;
  border-radius: 50%%;
  background: %s;
  opacity: 0.7;
}
/* BACK */
.card-back {
  background: %s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}
.card-back-initial {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 20px;
  font-weight: 900;
  color: #fff;
}
.card-back-name {
  font-family: '%s', Georgia, serif;
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
}
.card-back-tagline {
  font-size: 8.5px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
}
@media print {
  html, body { background: #222 !important; }
  .card { box-shadow: none !important; }
}
</style>
</head>
<body>
<div>
  <div class="label">Front</div>
  <div class="card card-front">
    <div>
      <div class="card-front-brand">%s</div>
      <div class="card-front-tagline">%s</div>
    </div>
    <div>
      <div class="card-front-divider"></div>
      <div class="card-front-contact">
        <span>hello@%s.com</span>
        <span>www.%s.com</span>
      </div>
    </div>
    <div class="card-front-dot"></div>
  </div>
</div>
<div>
  <div class="label">Back</div>
  <div class="card card-back">
    <div class="card-back-initial">%s</div>
    <div class="card-back-name">%s</div>
    %s
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.PrimaryHex,    // left accent bar
		b.HeadlineFont,  // brand name font
		b.PrimaryHex,    // dot color
		b.PrimaryHex,    // card back bg
		b.HeadlineFont,  // initial font
		b.HeadlineFont,  // back name font
		htmlEsc(b.Name),
		htmlEsc(taglineShort),
		domain, domain,
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
		func() string {
			if taglineShort != "" {
				return fmt.Sprintf(`<div class="card-back-tagline">%s</div>`, htmlEsc(taglineShort))
			}
			return ""
		}(),
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
  background: #f0f0f0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
}
.phone-frame {
  width: 375px;
  background: #fff;
  border-radius: 44px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(0,0,0,0.08);
  position: relative;
}
.phone-notch {
  position: absolute;
  top: 0; left: 50%%;
  transform: translateX(-50%%);
  width: 120px; height: 32px;
  background: #111;
  border-radius: 0 0 20px 20px;
  z-index: 10;
}
.screen {
  padding-top: 44px;
  background: #fff;
}
/* Profile header bg */
.profile-header-bg {
  height: 90px;
  background: %s;
  position: relative;
}
.profile-header-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, %s 0%%, %s 100%%);
  opacity: 0.7;
}
/* Profile pic */
.profile-pic-wrap {
  padding: 0 16px;
  margin-top: -36px;
  position: relative;
  z-index: 2;
}
.profile-pic {
  width: 72px; height: 72px;
  border-radius: 50%%;
  background: %s;
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 26px;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.profile-info {
  padding: 10px 16px 0;
}
.profile-name {
  font-size: 15px;
  font-weight: 800;
  color: #0a0a0a;
  letter-spacing: -0.01em;
}
.profile-handle {
  font-size: 12px;
  color: #888;
  margin-top: 1px;
}
.profile-bio {
  font-size: 12.5px;
  color: #444;
  margin-top: 8px;
  line-height: 1.45;
  font-style: italic;
}
.profile-link {
  font-size: 12px;
  color: %s;
  font-weight: 600;
  margin-top: 4px;
}
.profile-stats {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 10px;
}
.stat { text-align: center; }
.stat-num {
  font-size: 14px;
  font-weight: 800;
  color: #0a0a0a;
}
.stat-label {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1px;
}
.follow-btn {
  display: block;
  margin: 12px 16px;
  background: %s;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 0;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  letter-spacing: 0.02em;
}
/* Posts grid */
.posts-label {
  padding: 8px 16px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #ccc;
  border-top: 1px solid #f0f0f0;
}
.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.post {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: '%s', Georgia, serif;
  font-size: 13px;
  font-weight: 900;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
}
.post-1 { background: %s; }
.post-2 { background: %s; }
.post-3 { background: %s; }
.phone-home-bar {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.home-indicator {
  width: 100px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
}
@media (max-width: 420px) {
  .phone-frame { width: 100%%; border-radius: 24px; }
}
</style>
</head>
<body>
<div class="phone-frame">
  <div class="phone-notch"></div>
  <div class="screen">
    <!-- Header BG -->
    <div class="profile-header-bg"></div>
    <!-- Profile pic -->
    <div class="profile-pic-wrap">
      <div class="profile-pic">%s</div>
    </div>
    <!-- Profile info -->
    <div class="profile-info">
      <div class="profile-name">%s</div>
      <div class="profile-handle">@%s</div>
      %s
      <div class="profile-link">%s.com</div>
    </div>
    <!-- Stats -->
    <div class="profile-stats">
      <div class="stat"><div class="stat-num">—</div><div class="stat-label">Posts</div></div>
      <div class="stat"><div class="stat-num">—</div><div class="stat-label">Followers</div></div>
      <div class="stat"><div class="stat-num">—</div><div class="stat-label">Following</div></div>
    </div>
    <!-- Follow -->
    <div class="follow-btn">Follow</div>
    <!-- Posts -->
    <div class="posts-label">Posts</div>
    <div class="posts-grid">
      <div class="post post-1">%s</div>
      <div class="post post-2">%s</div>
      <div class="post post-3">%s</div>
    </div>
    <!-- Home bar -->
    <div class="phone-home-bar">
      <div class="home-indicator"></div>
    </div>
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.PrimaryHex,
		b.PrimaryHex, b.SecondaryHex, // header gradient
		b.PrimaryHex,   // profile pic bg
		b.HeadlineFont, // profile pic font
		b.PrimaryHex,   // link color
		b.PrimaryHex,   // follow button
		b.HeadlineFont, // post font
		b.PrimaryHex,   // post 1
		b.SecondaryHex, // post 2
		b.AccentHex,    // post 3
		// Template vars below
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
		htmlEsc(handle),
		func() string {
			if taglineShort != "" {
				return fmt.Sprintf(`<div class="profile-bio">%s</div>`, htmlEsc(taglineShort))
			}
			return ""
		}(),
		htmlEsc(handle),
		htmlEsc(b.Name),
		htmlEsc(b.Initial),
		htmlEsc(b.Name),
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
  background: #e8e8e8;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  font-family: '%s', 'Helvetica Neue', Helvetica, sans-serif;
}
.paper {
  width: 100%%;
  max-width: 600px;
  min-height: 850px;
  background: #fff;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* Header */
.lh-header {
  background: %s;
  padding: 24px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lh-header-left {
  display: flex;
  flex-direction: column;
}
.lh-brand {
  font-family: '%s', Georgia, serif;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.lh-tagline {
  font-size: 9px;
  color: rgba(255,255,255,0.55);
  margin-top: 4px;
  font-style: italic;
  letter-spacing: 0.04em;
}
.lh-header-right {
  text-align: right;
}
.lh-contact-line {
  font-size: 8.5px;
  color: rgba(255,255,255,0.6);
  line-height: 1.7;
  letter-spacing: 0.04em;
}
/* Sub-header accent */
.lh-subheader {
  height: 4px;
  background: %s;
}
/* Body area */
.lh-body {
  flex: 1;
  padding: 36px 36px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lh-date {
  font-size: 9px;
  color: #888;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.lh-to {
  font-size: 10px;
  color: #555;
  line-height: 1.6;
}
.lh-subject {
  font-size: 11px;
  font-weight: 700;
  color: #222;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-left: 3px solid %s;
  padding-left: 10px;
}
/* Placeholder text lines */
.lh-text-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lh-line {
  height: 1px;
  background: #e8e8e8;
  border-radius: 1px;
}
.lh-line.full { width: 100%%; }
.lh-line.long { width: 90%%; }
.lh-line.mid { width: 75%%; }
.lh-line.short { width: 55%%; }
.lh-signature-area {
  margin-top: 24px;
}
.lh-sign-label {
  font-size: 9px;
  color: #aaa;
  margin-bottom: 20px;
}
.lh-sign-line {
  width: 140px;
  height: 1px;
  background: #ccc;
  margin-bottom: 6px;
}
.lh-sign-name {
  font-size: 8.5px;
  font-weight: 700;
  color: #555;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
/* Footer */
.lh-footer {
  background: %s;
  padding: 12px 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 3px solid %s;
}
.lh-footer-left {
  font-size: 7.5px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.1em;
}
.lh-footer-right {
  font-size: 7.5px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
}
@media print {
  html, body { background: #fff !important; padding: 0 !important; }
  .paper { box-shadow: none !important; min-height: 100vh; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
@media (max-width: 480px) {
  .paper { min-height: unset; }
  .lh-header { flex-direction: column; gap: 12px; text-align: center; }
  .lh-header-right { text-align: center; }
}
</style>
</head>
<body>
<div class="paper">
  <!-- Header -->
  <div class="lh-header">
    <div class="lh-header-left">
      <div class="lh-brand">%s</div>
      %s
    </div>
    <div class="lh-header-right">
      <div class="lh-contact-line">hello@%s.com</div>
      <div class="lh-contact-line">www.%s.com</div>
      <div class="lh-contact-line">123 Brand Street, City 000000</div>
    </div>
  </div>
  <div class="lh-subheader"></div>

  <!-- Body -->
  <div class="lh-body">
    <div class="lh-date">Date: — — / — — / 2026</div>
    <div class="lh-to">To:<br/>Recipient Name<br/>Address Line</div>
    <div class="lh-subject">Subject / Reference</div>
    <div class="lh-text-block">
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line long"></div>
      <div class="lh-line full"></div>
      <div class="lh-line mid"></div>
    </div>
    <div class="lh-text-block">
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line full"></div>
      <div class="lh-line short"></div>
    </div>
    <div class="lh-text-block">
      <div class="lh-line long"></div>
      <div class="lh-line full"></div>
      <div class="lh-line mid"></div>
    </div>
    <div class="lh-signature-area">
      <div class="lh-sign-label">Warm regards,</div>
      <div class="lh-sign-line"></div>
      <div class="lh-sign-name">Team %s</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="lh-footer">
    <div class="lh-footer-left">%s.com · hello@%s.com</div>
    <div class="lh-footer-right">© 2026 %s</div>
  </div>
</div>
</body>
</html>`,
		htmlEsc(b.Name),
		googleFontURL(b.HeadlineFont, b.BodyFont),
		b.BodyFont,
		b.PrimaryHex,   // header bg
		b.HeadlineFont, // brand name font
		b.SecondaryHex, // sub-header accent
		b.PrimaryHex,   // subject border
		b.PrimaryHex,   // footer bg
		b.SecondaryHex, // footer top border
		// Template vars
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

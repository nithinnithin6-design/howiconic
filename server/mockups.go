package server

import (
	"fmt"
	"strings"
)

// ─── MOCKUP TYPES ─────────────────────────────────────────────────────────────

type Mockup struct {
	Type string `json:"type"`
	SVG  string `json:"svg"`
}

// ─── BRAND MOCKUPS ────────────────────────────────────────────────────────────

func generateMockups(brandName, tagline, primaryColor, secondaryColor, accentColor string) []Mockup {
	if primaryColor == "" {
		primaryColor = "#f17022"
	}
	if secondaryColor == "" {
		secondaryColor = "#2a2a2a"
	}
	if accentColor == "" {
		accentColor = "#f5f5f5"
	}
	return []Mockup{
		{Type: "business_card", SVG: businessCardSVG(brandName, tagline, primaryColor, secondaryColor)},
		{Type: "letterhead", SVG: letterheadSVG(brandName, tagline, primaryColor, secondaryColor)},
		{Type: "phone_screen", SVG: phoneScreenSVG(brandName, tagline, primaryColor, secondaryColor, accentColor)},
		{Type: "tshirt", SVG: tshirtSVG(brandName, primaryColor, secondaryColor)},
	}
}

// ─── SOCIAL MEDIA TEMPLATES ───────────────────────────────────────────────────

func generateSocialTemplates(brandName, tagline, primaryColor, secondaryColor, accentColor string) []Mockup {
	if primaryColor == "" {
		primaryColor = "#f17022"
	}
	if secondaryColor == "" {
		secondaryColor = "#2a2a2a"
	}
	if accentColor == "" {
		accentColor = "#f5f5f5"
	}
	return []Mockup{
		{Type: "instagram_post", SVG: instagramPostSVG(brandName, tagline, primaryColor, secondaryColor, accentColor)},
		{Type: "linkedin_banner", SVG: linkedinBannerSVG(brandName, tagline, primaryColor, secondaryColor)},
		{Type: "email_signature", SVG: emailSignatureSVG(brandName, tagline, primaryColor, secondaryColor)},
	}
}

// ─── BUSINESS CARD (350×200, ratio 3.5:2) ────────────────────────────────────

func businessCardSVG(name, tagline, primary, secondary string) string {
	nameLower := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	nameUpper := strings.ToUpper(name)

	// Contrasting text color based on primary brightness
	textColor := "#ffffff"
	subColor := "rgba(255,255,255,0.55)"
	dimColor := "rgba(255,255,255,0.3)"

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 200">
  <defs>
    <linearGradient id="bcGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <!-- Card background -->
  <rect width="350" height="200" rx="10" fill="url(#bcGrad)"/>
  <!-- Dark overlay bottom -->
  <rect width="350" height="200" rx="10" fill="rgba(0,0,0,0.22)"/>
  <!-- Accent bar left -->
  <rect x="0" y="0" width="4" height="200" rx="2" fill="%s"/>
  <!-- Geometric accent — top right corner -->
  <circle cx="310" cy="26" r="44" fill="%s" fill-opacity="0.12"/>
  <circle cx="318" cy="18" r="24" fill="%s" fill-opacity="0.10"/>
  <!-- Brand name -->
  <text x="24" y="82" font-family="'Helvetica Neue', Arial, sans-serif" font-size="26" font-weight="900" fill="%s" letter-spacing="3">%s</text>
  <!-- Divider -->
  <rect x="24" y="94" width="48" height="2" rx="1" fill="%s" fill-opacity="0.5"/>
  <!-- Tagline -->
  <text x="24" y="118" font-family="'Georgia', serif" font-style="italic" font-size="10.5" fill="%s">%s</text>
  <!-- Contact info -->
  <text x="24" y="165" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8.5" fill="%s">hello@%s.com</text>
  <text x="24" y="180" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8.5" fill="%s">www.%s.com</text>
  <!-- Bottom right accent dot -->
  <circle cx="328" cy="178" r="5" fill="%s" fill-opacity="0.6"/>
  <circle cx="316" cy="178" r="3" fill="%s" fill-opacity="0.35"/>
</svg>`,
		primary, secondary,        // gradient
		secondary,                 // accent bar
		secondary, secondary,      // corner circles
		textColor, nameUpper,      // name
		secondary,                 // divider
		subColor, tagline,         // tagline
		dimColor, nameLower,       // email
		dimColor, nameLower,       // website
		secondary, secondary,      // dots
	)
}

// ─── LETTERHEAD (794×1123, A4 portrait) ──────────────────────────────────────

func letterheadSVG(name, tagline, primary, secondary string) string {
	nameUpper := strings.ToUpper(name)
	nameLower := strings.ToLower(strings.ReplaceAll(name, " ", ""))

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123">
  <!-- Page background -->
  <rect width="794" height="1123" fill="#ffffff"/>
  <!-- Header block -->
  <rect width="794" height="100" fill="%s"/>
  <!-- Header accent bar -->
  <rect y="100" width="794" height="4" fill="%s"/>
  <!-- Brand name in header -->
  <text x="48" y="63" font-family="'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="900" fill="white" letter-spacing="4">%s</text>
  <!-- Tagline in header -->
  <text x="48" y="85" font-family="'Georgia', serif" font-style="italic" font-size="10" fill="rgba(255,255,255,0.65)">%s</text>
  <!-- Top right: geometric mark -->
  <circle cx="748" cy="50" r="36" fill="rgba(255,255,255,0.08)"/>
  <circle cx="748" cy="50" r="18" fill="rgba(255,255,255,0.12)"/>
  <!-- Date line -->
  <text x="48" y="155" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9" fill="#888888" letter-spacing="2">DATE / / 2026</text>
  <!-- Body content lines (placeholder) -->
  <rect x="48" y="175" width="280" height="1.5" rx="1" fill="#e5e5e5"/>
  <rect x="48" y="210" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="235" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="260" width="580" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="285" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="310" width="640" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="355" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="380" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="405" width="520" height="1" rx="0.5" fill="#f0f0f0"/>
  <!-- Section break -->
  <rect x="48" y="440" width="48" height="3" rx="1.5" fill="%s"/>
  <!-- Second paragraph -->
  <rect x="48" y="465" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="490" width="698" height="1" rx="0.5" fill="#f0f0f0"/>
  <rect x="48" y="515" width="460" height="1" rx="0.5" fill="#f0f0f0"/>
  <!-- Signature area -->
  <text x="48" y="620" font-family="'Georgia', serif" font-style="italic" font-size="11" fill="#444444">Warm regards,</text>
  <rect x="48" y="660" width="140" height="1.5" rx="0.75" fill="#cccccc"/>
  <text x="48" y="680" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9" font-weight="700" fill="#333333" letter-spacing="1">TEAM %s</text>
  <!-- Footer -->
  <rect y="1075" width="794" height="48" fill="%s"/>
  <rect y="1071" width="794" height="4" fill="%s"/>
  <text x="48" y="1103" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" fill="rgba(255,255,255,0.55)" letter-spacing="1">%s.com · hello@%s.com</text>
  <text x="746" y="1103" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" fill="rgba(255,255,255,0.35)" text-anchor="end">© 2026 %s</text>
</svg>`,
		primary,              // header bg
		secondary,            // header accent bar
		nameUpper,            // brand name
		tagline,              // tagline
		secondary,            // section break
		nameUpper,            // signature
		primary,              // footer bg
		secondary,            // footer accent
		nameLower, nameLower, // footer contact
		name,                 // footer copyright
	)
}

// ─── PHONE SCREEN (320×620) ───────────────────────────────────────────────────

func phoneScreenSVG(name, tagline, primary, secondary, accent string) string {
	nameUpper := strings.ToUpper(name)

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 620">
  <defs>
    <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
    <clipPath id="phoneClip">
      <rect x="8" y="8" width="304" height="604" rx="34"/>
    </clipPath>
  </defs>
  <!-- Phone shell -->
  <rect width="320" height="620" rx="40" fill="#1a1a1a"/>
  <!-- Phone screen area -->
  <rect x="8" y="8" width="304" height="604" rx="34" fill="url(#phoneGrad)" clip-path="url(#phoneClip)"/>
  <!-- Background geometry -->
  <circle cx="260" cy="120" r="120" fill="%s" fill-opacity="0.15" clip-path="url(#phoneClip)"/>
  <circle cx="60" cy="500" r="90" fill="%s" fill-opacity="0.10" clip-path="url(#phoneClip)"/>
  <!-- Status bar -->
  <rect x="8" y="8" width="304" height="36" fill="rgba(0,0,0,0.2)" clip-path="url(#phoneClip)"/>
  <!-- Notch -->
  <rect x="110" y="12" width="100" height="20" rx="10" fill="#1a1a1a"/>
  <!-- Logo mark (geometric) -->
  <circle cx="160" cy="248" r="52" fill="rgba(255,255,255,0.12)"/>
  <circle cx="160" cy="248" r="34" fill="rgba(255,255,255,0.18)"/>
  <circle cx="160" cy="248" r="18" fill="%s"/>
  <!-- App name -->
  <text x="160" y="332" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="4">%s</text>
  <!-- Tagline -->
  <text x="160" y="358" text-anchor="middle" font-family="'Georgia', serif" font-style="italic" font-size="9.5" fill="rgba(255,255,255,0.55)">%s</text>
  <!-- CTA button -->
  <rect x="80" y="390" width="160" height="40" rx="20" fill="%s"/>
  <text x="160" y="415" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10" font-weight="800" fill="%s" letter-spacing="2">GET STARTED</text>
  <!-- Bottom indicator bar -->
  <rect x="120" y="588" width="80" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
  <!-- Side buttons -->
  <rect x="0" y="140" width="4" height="50" rx="2" fill="#2a2a2a"/>
  <rect x="0" y="205" width="4" height="50" rx="2" fill="#2a2a2a"/>
  <rect x="316" y="165" width="4" height="70" rx="2" fill="#2a2a2a"/>
</svg>`,
		primary, secondary,     // gradient
		primary, secondary,     // bg circles
		accent,                 // center dot
		nameUpper,              // app name
		tagline,                // tagline
		accent,                 // CTA button bg
		primary,                // CTA text
	)
}

// ─── T-SHIRT (500×550) ────────────────────────────────────────────────────────

func tshirtSVG(name, primary, secondary string) string {
	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550">
  <defs>
    <filter id="tshirtShadow" x="-5%%" y="-5%%" width="110%%" height="115%%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  <!-- T-shirt shape -->
  <g filter="url(#tshirtShadow)">
    <!-- Main body -->
    <path d="M125 90 L60 160 L120 190 L120 490 L380 490 L380 190 L440 160 L375 90 
             C375 90, 340 105, 320 115 C305 130, 295 145, 250 145 
             C205 145, 195 130, 180 115 C160 105, 125 90, 125 90 Z" 
          fill="%s"/>
    <!-- Left sleeve -->
    <path d="M125 90 L50 70 L60 160 L120 190 L125 90 Z" fill="%s"/>
    <!-- Right sleeve -->
    <path d="M375 90 L450 70 L440 160 L380 190 L375 90 Z" fill="%s"/>
    <!-- Collar -->
    <path d="M180 115 C195 130, 205 145, 250 145 C295 145, 305 130, 320 115 
             C305 108, 270 102, 250 102 C230 102, 195 108, 180 115 Z" 
          fill="%s" fill-opacity="0.25"/>
  </g>
  <!-- Logo mark on chest (centered) -->
  <!-- Outer ring -->
  <circle cx="250" cy="285" r="54" fill="rgba(255,255,255,0.08)"/>
  <!-- Middle ring -->
  <circle cx="250" cy="285" r="38" fill="rgba(255,255,255,0.12)"/>
  <!-- Center -->
  <circle cx="250" cy="285" r="22" fill="%s" fill-opacity="0.9"/>
  <!-- Brand initial -->
  <text x="250" y="292" text-anchor="middle" dominant-baseline="middle"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="900"
        fill="%s" letter-spacing="1">%s</text>
  <!-- Sleeve highlight -->
  <path d="M120 190 L125 90 L130 92" stroke="rgba(255,255,255,0.06)" stroke-width="1" fill="none"/>
  <path d="M380 190 L375 90 L370 92" stroke="rgba(255,255,255,0.06)" stroke-width="1" fill="none"/>
</svg>`,
		primary,   // shirt body
		secondary, // left sleeve
		secondary, // right sleeve
		secondary, // collar
		secondary, // chest mark center fill
		primary,   // initial text
		strings.ToUpper(name[:min(2, len(name))]), // first 2 letters
	)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ─── INSTAGRAM POST (1080×1080, shown at 540×540) ─────────────────────────────

func instagramPostSVG(name, tagline, primary, secondary, accent string) string {
	nameUpper := strings.ToUpper(name)

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#igGrad)"/>
  <!-- Dark vignette overlay -->
  <rect width="1080" height="1080" fill="rgba(0,0,0,0.28)"/>
  <!-- Geometric background elements -->
  <circle cx="900" cy="180" r="320" fill="%s" fill-opacity="0.1"/>
  <circle cx="180" cy="900" r="240" fill="%s" fill-opacity="0.08"/>
  <!-- Top accent bar -->
  <rect width="1080" height="6" fill="%s"/>
  <!-- Bottom accent bar -->
  <rect y="1074" width="1080" height="6" fill="%s"/>
  <!-- Grid lines (subtle) -->
  <line x1="360" y1="0" x2="360" y2="1080" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="720" y1="0" x2="720" y2="1080" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="360" x2="1080" y2="360" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="720" x2="1080" y2="720" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <!-- Logo mark (center) -->
  <circle cx="540" cy="420" r="110" fill="rgba(255,255,255,0.1)"/>
  <circle cx="540" cy="420" r="72" fill="rgba(255,255,255,0.15)"/>
  <circle cx="540" cy="420" r="42" fill="%s" fill-opacity="0.9"/>
  <text x="540" y="435" text-anchor="middle" dominant-baseline="middle"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="36" font-weight="900"
        fill="%s">%s</text>
  <!-- Brand name large -->
  <text x="540" y="598" text-anchor="middle"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="86" font-weight="900"
        fill="white" letter-spacing="12">%s</text>
  <!-- Tagline -->
  <text x="540" y="660" text-anchor="middle"
        font-family="'Georgia', serif" font-style="italic" font-size="28" fill="rgba(255,255,255,0.6)">%s</text>
  <!-- Divider -->
  <rect x="460" y="700" width="160" height="2" rx="1" fill="%s" fill-opacity="0.6"/>
  <!-- Sub-label -->
  <text x="540" y="750" text-anchor="middle"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="700"
        fill="rgba(255,255,255,0.3)" letter-spacing="6">NEW BRAND LAUNCH</text>
</svg>`,
		primary, secondary,       // gradient
		primary, secondary,       // bg circles
		accent, accent,           // top/bottom bars
		accent,                   // logo center
		primary,                  // initial text color
		strings.ToUpper(name[:min(2, len(name))]), // initials
		nameUpper,                // brand name
		tagline,                  // tagline
		accent,                   // divider
	)
}

// ─── LINKEDIN BANNER (1584×396, shown proportionally) ─────────────────────────

func linkedinBannerSVG(name, tagline, primary, secondary string) string {
	nameUpper := strings.ToUpper(name)

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1584 396">
  <defs>
    <linearGradient id="liGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="60%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1584" height="396" fill="url(#liGrad)"/>
  <!-- Dark overlay -->
  <rect width="1584" height="396" fill="rgba(0,0,0,0.2)"/>
  <!-- Right side geometric -->
  <circle cx="1440" cy="198" r="280" fill="rgba(255,255,255,0.05)"/>
  <circle cx="1484" cy="198" r="180" fill="rgba(255,255,255,0.07)"/>
  <!-- Left accent bar -->
  <rect width="6" height="396" fill="%s"/>
  <!-- Bottom accent bar -->
  <rect y="390" width="1584" height="6" fill="%s"/>
  <!-- Logo mark left -->
  <circle cx="120" cy="198" r="68" fill="rgba(255,255,255,0.1)"/>
  <circle cx="120" cy="198" r="44" fill="rgba(255,255,255,0.15)"/>
  <circle cx="120" cy="198" r="26" fill="rgba(255,255,255,0.2)"/>
  <!-- Brand Name — hero -->
  <text x="220" y="178" 
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="68" font-weight="900" 
        fill="white" letter-spacing="8">%s</text>
  <!-- Tagline -->
  <text x="222" y="228"
        font-family="'Georgia', serif" font-style="italic" font-size="24" fill="rgba(255,255,255,0.55)">%s</text>
  <!-- Divider -->
  <rect x="222" y="252" width="80" height="3" rx="1.5" fill="%s" fill-opacity="0.7"/>
  <!-- Descriptor -->
  <text x="222" y="286"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="700"
        fill="rgba(255,255,255,0.35)" letter-spacing="4">BRAND IDENTITY SYSTEM</text>
  <!-- Right side detail -->
  <text x="1480" y="210" text-anchor="end"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="700"
        fill="rgba(255,255,255,0.2)" letter-spacing="3">howiconic.com</text>
</svg>`,
		primary, secondary, primary, // gradient
		secondary, secondary,         // accent bars
		nameUpper,                    // brand name
		tagline,                      // tagline
		secondary,                    // divider
	)
}

// ─── EMAIL SIGNATURE (600×200) ────────────────────────────────────────────────

func emailSignatureSVG(name, tagline, primary, secondary string) string {
	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200">
  <!-- Background -->
  <rect width="600" height="200" fill="#ffffff"/>
  <!-- Left colored bar -->
  <rect width="4" height="200" fill="%s"/>
  <!-- Top subtle divider -->
  <rect x="0" y="0" width="600" height="1" fill="%s" fill-opacity="0.3"/>
  <!-- Logo mark -->
  <circle cx="44" cy="72" r="28" fill="%s" fill-opacity="0.12"/>
  <circle cx="44" cy="72" r="18" fill="%s" fill-opacity="0.18"/>
  <circle cx="44" cy="72" r="10" fill="%s"/>
  <text x="44" y="77" text-anchor="middle" dominant-baseline="middle"
        font-family="'Helvetica Neue', Arial, sans-serif" font-size="9" font-weight="900"
        fill="white">%s</text>
  <!-- Name -->
  <text x="88" y="54" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="900"
        fill="%s" letter-spacing="2">%s</text>
  <!-- Tagline -->
  <text x="88" y="76" font-family="'Georgia', serif" font-style="italic" font-size="11"
        fill="#666666">%s</text>
  <!-- Horizontal rule -->
  <rect x="88" y="90" width="460" height="1" fill="#e5e5e5"/>
  <!-- Contact row -->
  <text x="88" y="112" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10"
        fill="#999999" letter-spacing="0.5">hello@%s.com</text>
  <text x="88" y="130" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10"
        fill="#999999" letter-spacing="0.5">www.%s.com</text>
  <!-- Color swatches bottom right -->
  <rect x="488" y="140" width="22" height="22" rx="4" fill="%s"/>
  <rect x="516" y="140" width="22" height="22" rx="4" fill="%s"/>
  <rect x="544" y="140" width="22" height="22" rx="4" fill="%s"/>
  <!-- Footer text -->
  <text x="88" y="172" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8.5"
        fill="#cccccc" letter-spacing="1">POWERED BY HOWICONIC</text>
  <!-- Bottom border -->
  <rect y="196" width="600" height="4" fill="%s"/>
</svg>`,
		primary,   // left bar
		primary,   // top divider
		primary, primary, primary, // logo circles
		strings.ToUpper(name[:min(2, len(name))]), // initials
		primary,   // name color
		name,      // brand name
		tagline,   // tagline
		strings.ToLower(strings.ReplaceAll(name, " ", "")), // email
		strings.ToLower(strings.ReplaceAll(name, " ", "")), // website
		primary, secondary, "#f5f5f5", // color swatches
		primary,   // bottom border
	)
}

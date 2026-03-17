package server

import "fmt"

// generateBusinessCardSVG creates a polished business card SVG (340x200)
func generateBusinessCardSVG(brandName, tagline, primaryHex, secondaryHex, headingFont, bodyFont string) string {
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	if secondaryHex == "" {
		secondaryHex = "#2a2a2a"
	}
	if headingFont == "" {
		headingFont = "Playfair Display"
	}
	if bodyFont == "" {
		bodyFont = "Inter"
	}
	if brandName == "" {
		brandName = "BRAND"
	}

	// Shorten tagline for card
	if len(tagline) > 50 {
		tagline = tagline[:47] + "..."
	}

	// Derive domain from brand name
	domain := fmt.Sprintf("%s.com", sanitizeDomain(brandName))
	email := fmt.Sprintf("hello@%s", domain)

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 200" width="340" height="200">
  <defs>
    <linearGradient id="bcGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
  </defs>
  <!-- Card background -->
  <rect width="340" height="200" rx="12" fill="#0d0d0d"/>
  <!-- Accent strip -->
  <rect x="0" y="0" width="6" height="200" rx="3" fill="%s"/>
  <!-- Subtle gradient overlay -->
  <rect x="200" y="0" width="140" height="200" rx="0" fill="url(#bcGrad)" opacity="0.07"/>
  <!-- Brand name -->
  <text x="28" y="80" font-family="'%s', 'Georgia', serif" font-size="28" font-weight="900" fill="white" letter-spacing="0.02em">%s</text>
  <!-- Tagline -->
  <text x="28" y="108" font-family="'%s', 'Arial', sans-serif" font-size="11" fill="rgba(255,255,255,0.45)" font-style="italic">%s</text>
  <!-- Divider line -->
  <line x1="28" y1="128" x2="312" y2="128" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <!-- Contact info -->
  <text x="28" y="154" font-family="'%s', 'Arial', sans-serif" font-size="10" fill="rgba(255,255,255,0.3)">%s</text>
  <text x="28" y="174" font-family="'%s', 'Arial', sans-serif" font-size="10" fill="rgba(255,255,255,0.3)">%s</text>
  <!-- Accent dot -->
  <circle cx="312" cy="168" r="8" fill="%s" opacity="0.8"/>
</svg>`, primaryHex, secondaryHex, primaryHex, headingFont, escSVG(brandName), bodyFont, escSVG(tagline), bodyFont, escSVG(email), bodyFont, escSVG(domain), primaryHex)
}

// generateSocialHeaderSVG creates a social media header banner SVG (800x280)
func generateSocialHeaderSVG(brandName, tagline, primaryHex, secondaryHex, headingFont string) string {
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	if secondaryHex == "" {
		secondaryHex = "#1a1a2e"
	}
	if headingFont == "" {
		headingFont = "Playfair Display"
	}
	if brandName == "" {
		brandName = "BRAND"
	}
	if len(tagline) > 80 {
		tagline = tagline[:77] + "..."
	}

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 280" width="800" height="280">
  <defs>
    <linearGradient id="shGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
    <filter id="blur1">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="800" height="280" fill="#0a0a0a"/>
  <!-- Gradient wash -->
  <rect width="800" height="280" fill="url(#shGrad)" opacity="0.18"/>
  <!-- Decorative circles (blurred glow) -->
  <circle cx="680" cy="60" r="120" fill="%s" opacity="0.12" filter="url(#blur1)"/>
  <circle cx="120" cy="220" r="90" fill="%s" opacity="0.08" filter="url(#blur1)"/>
  <!-- Geometric accent lines -->
  <line x1="0" y1="260" x2="800" y2="260" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
  <line x1="0" y1="20" x2="800" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <!-- Brand name -->
  <text x="400" y="148" font-family="'%s', 'Georgia', serif" font-size="56" font-weight="900" fill="white" text-anchor="middle" letter-spacing="0.04em">%s</text>
  <!-- Tagline -->
  <text x="400" y="194" font-family="'Arial', sans-serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="middle" font-style="italic" letter-spacing="0.08em">%s</text>
  <!-- Bottom accent bar -->
  <rect x="340" y="220" width="120" height="3" rx="2" fill="%s" opacity="0.7"/>
</svg>`, primaryHex, secondaryHex, primaryHex, secondaryHex, headingFont, escSVG(brandName), escSVG(tagline), primaryHex)
}

// generateAppIconSVG creates an app icon SVG (120x120)
func generateAppIconSVG(brandInitial, primaryHex string) string {
	if primaryHex == "" {
		primaryHex = "#f17022"
	}
	if brandInitial == "" {
		brandInitial = "B"
	}
	// Only use first rune
	runes := []rune(brandInitial)
	if len(runes) > 0 {
		brandInitial = string(runes[0:1])
	}

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
  </defs>
  <!-- Rounded rect background -->
  <rect width="120" height="120" rx="26" fill="url(#aiGrad)"/>
  <!-- Inner subtle highlight -->
  <rect x="1" y="1" width="118" height="60" rx="25" fill="white" opacity="0.06"/>
  <!-- Brand initial -->
  <text x="60" y="76" font-family="'Georgia', 'Times New Roman', serif" font-size="58" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-0.02em">%s</text>
</svg>`, primaryHex, adjustHex(primaryHex, -30), escSVG(brandInitial))
}

// sanitizeDomain makes a URL-safe domain from brand name
func sanitizeDomain(name string) string {
	result := make([]byte, 0, len(name))
	for _, c := range []byte(name) {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') {
			result = append(result, c)
		} else if (c >= 'A' && c <= 'Z') {
			result = append(result, c+32) // lowercase
		} else if c == ' ' || c == '-' {
			result = append(result, '-')
		}
	}
	return string(result)
}

// escSVG escapes special SVG/XML characters
func escSVG(s string) string {
	result := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '&':
			result = append(result, []byte("&amp;")...)
		case '<':
			result = append(result, []byte("&lt;")...)
		case '>':
			result = append(result, []byte("&gt;")...)
		case '"':
			result = append(result, []byte("&quot;")...)
		default:
			result = append(result, s[i])
		}
	}
	return string(result)
}

// adjustHex darkens/lightens a hex color by delta (-255 to 255)
func adjustHex(hex string, delta int) string {
	if len(hex) < 7 {
		return hex
	}
	h := hex
	if h[0] == '#' {
		h = h[1:]
	}
	if len(h) != 6 {
		return hex
	}
	parse := func(s string) int {
		v := 0
		for _, c := range s {
			v <<= 4
			if c >= '0' && c <= '9' {
				v += int(c - '0')
			} else if c >= 'a' && c <= 'f' {
				v += int(c-'a') + 10
			} else if c >= 'A' && c <= 'F' {
				v += int(c-'A') + 10
			}
		}
		return v
	}
	clamp := func(v int) int {
		if v < 0 {
			return 0
		}
		if v > 255 {
			return 255
		}
		return v
	}
	r := clamp(parse(h[0:2]) + delta)
	g := clamp(parse(h[2:4]) + delta)
	b := clamp(parse(h[4:6]) + delta)
	return fmt.Sprintf("#%02x%02x%02x", r, g, b)
}

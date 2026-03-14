# HowIconic Frontend Enhancement Spec
## Principle: Same soul, higher fidelity. Enhance, don't redesign.

## Keep (Sacred)
- Dark canvas (#0a0a0a), Parijata Orange (#f17022)
- Playfair Display + Bodoni Moda + Inter
- Blueprint grid texture, noise overlay
- Industrial naming convention (SOVEREIGN_ENGINE, etc.)
- The bloom/petal animation
- Loading ceremony (phases, progress, seal)
- Section numbering system (01, 02, 03...)

## Add (Motion Layer)
- GSAP + ScrollTrigger for scroll-driven reveals
- SplitText on all headings (character-by-character reveal)
- Lenis smooth scrolling
- Page transition morphs (Framer Motion / FLIP animations)
- Stagger animations on grid items (vault cards, color swatches)

## Add (Depth Layer)  
- WebGL bloom (Three.js / custom GLSL shader) replacing CSS bloom
- Particle system on engine page (reacts to mouse)
- Parallax depth on section backgrounds
- Grain/noise as WebGL post-process (not CSS pseudo-element)

## Add (Feel Layer)
- Custom cursor (dot + ring, scale on hover)
- Magnetic buttons (slight pull toward cursor)
- Hover distortion on logo cards (SVG filter displacement)
- Scroll velocity-based effects (faster scroll = more blur)
- Smooth number counters (audit scores, percentages)

## Add (Sound Layer)
- Subtle click on button press
- Whoosh on page transition
- Low hum on engine page (ambient)
- Chime on brand manifestation complete
- All sounds optional, muted by default, toggle in nav

## Add (Typography Motion)
- Variable font weight animation on hover
- Kinetic headlines (slight parallax on words)
- Typewriter effect on audit verdicts
- Letter-spacing breathe animation on "HOWICONIC" wordmark

## Mobile Enhancements
- Touch-optimized interactions (no hover-dependent features)
- Haptic feedback triggers (if supported)
- Swipe gestures for vault navigation
- Bottom sheet patterns instead of modals

## Performance Targets
- Lighthouse Performance: 90+
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s  
- 60fps on all animations
- WebGL fallback to CSS for low-power devices

## Tech Stack Addition
- GSAP (GreenSock) + ScrollTrigger + SplitText
- Lenis (smooth scroll)
- Three.js (WebGL effects)
- Howler.js (sound)
- Keep React 19, Vite, Tailwind

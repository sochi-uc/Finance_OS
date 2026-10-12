# Autonomous Web Design with Claude & AI Assistants
**Framework Source:** Nate Herk (@nateherkai)  
**Standardized for:** Sochi Finance OS & Future Frontends

---

## The Core Problem
Raw AI prompts generate generic, sterile, cookie-cutter website designs—characterized by flat Bootstrap-like components, default padding, robotic color contrast, and zero micro-interactions. Achieving high-end, bespoke digital products requires systematic constraint injection and automated verification.

---

## The 4-Step Setup for Humanized, World-Class Web Design

### 1. Design Rules Skill (Emil Kowalski Frontend Principles)
Never let an AI guess spatial or typographical hierarchy. Feed explicit, opinionated design heuristics:
* **Micro-Typography:**
  * Tighten display headline letter-spacing (`letter-spacing: -0.03em` to `-0.05em`).
  * Enforce tabular numbers (`font-variant-numeric: tabular-nums`) on all financial figures and dates.
  * Use optical sizing (`font-optical-sizing: auto`) and subtle vertical text gradients rather than flat `#fff`.
* **Spatial & Layout Cadence:**
  * Strict adherence to 4px / 8px spacing scales.
  * Generous whitespace around high-density data cards (`padding: 20px` to `24px`).
  * Never crowd containers; isolate focal metrics (`num-hero`, `num-lg`).
* **Subtle, Physics-Based Motion:**
  * Avoid standard `ease` or `linear` transitions.
  * Use Apple / Linear cubic-bezier curves: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances and `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for spring/elastic micro-interactions.
  * Implement physical press physics (`transform: scale(0.95)` on `:active`).
  * Shimmer effects and volumetric cursor glows to communicate vitality.

---

### 2. Taste Skill (Anchoring to High-End Benchmarks)
Ground the agent's aesthetic baseline in world-class design engineering:
* **Benchmark Tier:** **Linear**, **Stripe**, **Vercel**, **Apple Human Interface Guidelines (HIG)**.
* **Surface Design:**
  * Frosted glassmorphism (`backdrop-filter: blur(20px)` with semi-transparent rgba fills).
  * Layered borders (`1px solid var(--c-border)` with subtle inset highlights `inset 0 1px 0 rgba(255,255,255,0.05)`).
  * Tactile materials (e.g. ultra-subtle 2% fractal SVG noise overlay to eliminate flat digital sterility).

---

### 3. Tool Integration (Figma & Playwright MCP)
True autonomy requires sensory feedback:
* **Figma MCP:** Pull design tokens (color variables, typography scales, layout constraints) directly from source designs into code.
* **Playwright MCP / Chrome DevTools MCP:**
  * The AI must spin up a real headless browser instance.
  * Render real viewport dimensions (iPhone 15 Pro, iPad Air, 4K Desktop).
  * Capture screenshots, measure bounding boxes, and autonomously identify visual bugs (nav overlaps, clipping, safe-area inset failures) before human review.

---

### 4. Plain English Workflow
* State business logic and requirements in plain English.
* The system executes a closed-loop iterative process:
  `Specification → Token Mapping → Implementation → Headless Browser Render → Visual Bug Elimination → Polish`.

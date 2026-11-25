# Apple Design Standard: The Two Skills
**Framework:** Apple Human Interface Guidelines (HIG) & Fluid Interface Model  
**Standardized for:** Finance OS & Enterprise Financial Engineering

---

## The Philosophy
Generic AI code outputs sterile, template-heavy layouts characterized by default system fonts, flat borders, uniform padding, and static linear transitions. Apple-grade design breaks through this by combining two deeply disciplined skillsets:

---

## Skill 1: Design Foundations & Visual Token Engine (Aesthetics & Typographic Rigor)
Forces the interface to adopt authentic material layering, typographic optical sizing, and strict spatial discipline:

### 1. Typography & Hierarchy
* **Font Family:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif`.
* **Proportional Tracking (Letter-Spacing):**
  * Display titles & Hero metrics: `-0.035em` to `-0.045em`.
  * Standard section titles: `-0.02em` to `-0.025em`.
  * Micro-labels (`card-label`, `tags`): `+0.06em` to `+0.08em` uppercase tracking.
* **Tabular Numbers:**
  * Enforce `font-variant-numeric: tabular-nums` across all prices, yields, dates, percentages, and currencies. Prevents visual jitter during live updates.

### 2. Materials, Translucency & Layering
* **Frosted Materials:**
  * Avoid opaque `#121212` backgrounds.
  * Use Apple multi-layered glass: `background: rgba(18, 18, 22, 0.72); backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%);`.
* **Layered Ambient Shadows:**
  * Multi-stop shadows: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);`.
  * Elevated hover shadow: `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);`.
* **Border Radii (Apple Squircles):**
  * Containers & Cards: `16px`.
  * Interactive Buttons & Inputs: `10px`.
  * Floating Badges & Controls: `99px` (Pills).

### 3. Restraint & High-Information Density
* Eliminate redundant labels, folksy analogies, and non-actionable fluff.
* Prioritize clear financial metrics: Price, Floor, Ceiling, Quality Score, and Directive.

---

## Skill 2: Fluid Motion & Physics Engine (Behavioral & Interaction Standards)
Translates Apple WWDC fluid interface principles into responsive, tactile code:

### 1. Physics-Based Curves (Spring Curves)
* **Never use linear or basic ease-in-out.**
* **Apple Fluid Curve:** `cubic-bezier(0.16, 1, 0.3, 1)`.
  * Instantaneous initial velocity that decelerates smoothly into place without overshoot or delay.

### 2. Tactile Touch & Press Dynamics
* Elements must react immediately to user touch/pointer input:
  * `:active { transform: scale(0.965); transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1); }`
  * Provides hardware-level haptic feedback under thumb or mouse clicks.

### 3. Interruptible Transitions & Momentum Scrolling
* Drawers, sheets, and modal scrims must animate with `-webkit-backdrop-filter: blur(8px)` and smooth slide-in transitions.
* Momentum scrolling enabled natively on touch devices: `-webkit-overflow-scrolling: touch;`.
* No animation blocks the user: all interactions can be redirected or dismissed immediately.

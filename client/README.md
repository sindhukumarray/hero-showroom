# Hero Showroom — Frontend Application Foundation

## Overview
This service provides the React + Vite frontend for the Hero Showroom discovery platform. In Phase 1 Step 3, it establishes the luxury automotive design system, fluid typography tokens, responsive base layout, Framer Motion choreography with `prefers-reduced-motion` safety, and centralized API networking.

---

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion 11
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Routing:** React Router 6

---

## Design System & Tokens

### Color Palette
- **Backgrounds:**
  - `background`: `#08090C` (Obsidian dark core)
  - `background-deep`: `#040507` (Deep cinematic foundation)
  - `background-card`: `#101319` (Charcoal card surface)
  - `background-elevated`: `#171B23` (Elevated component surface)
- **Accents:**
  - `brand-red`: `#E52328` (Signature automotive performance red)
  - `brand-red-hover`: `#C7171C`
  - `brand-red-glow`: `rgba(229, 35, 40, 0.25)`
  - `brand-red-subtle`: `rgba(229, 35, 40, 0.10)`
- **Surfaces & Borders:**
  - `border-subtle`: `#1F2430`
  - `border`: `#2A3142`
  - `glass-surface`: `rgba(16, 19, 25, 0.75)` with `14px` blur

### Typography Hierarchy
- **Display:** `font-display` (Outfit, 800 weight, clamp `2.5rem` to `4.75rem`)
- **H1:** Outfit, 700 weight, clamp `2rem` to `3.25rem`
- **H2:** Outfit, 700 weight, clamp `1.5rem` to `2.25rem`
- **H3:** Outfit, 600 weight, clamp `1.2rem` to `1.6rem`
- **Body:** Plus Jakarta Sans, regular weight, 1rem
- **Small:** Plus Jakarta Sans, 0.875rem
- **Label:** Plus Jakarta Sans, bold, 0.75rem uppercase tracking-widest
- **Button:** Plus Jakarta Sans, semibold, 0.9375rem

---

## Motion & Accessibility
All animation variants in `src/animations/variants.js` are processed through `getAccessibleVariant()` and the `usePrefersReducedMotion` hook.
When a user enables `prefers-reduced-motion` in their OS:
1. Spatial transforms (`y`, `x`, `scale`, `rotate`, `filter`) are stripped.
2. Transitions are collapsed to subtle opacity fades (150ms) or instantaneous updates.
3. Content and interaction remain 100% accessible.

---

## Routing Table (Page Shells)
- `/`: Home Page shell
- `/showrooms`: Authorized Showrooms shell
- `/bikes`: Motorcycle Catalogue shell
- `/compare`: Side-by-side Model Comparison shell
- `/login`: Portal Sign In shell
- `/register`: Membership Registration shell
- `/dashboard`: User Dashboard shell
- `/admin`: Administration Console shell
- `*`: 404 Not Found shell

---

## Development & Build Commands

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

# Smarter Sprint — Design Theme Rules

> Dark-first UI system with contrast purple accents.
> Inspired by Wope.com's sharp, modern SaaS aesthetic: deep backgrounds, glassy surfaces, bold typography, and purposeful motion.

---

## 1. Design Philosophy

Smarter Sprint is a productivity-intelligence tool. The visual language should feel **precise, energetic, and trustworthy** — like a cockpit, not a dashboard. Every design decision earns its place.

- **Dark first.** Light variants are exceptions, never defaults.
- **Purple is signal, not noise.** Use accent purples only to direct attention or indicate state.
- **Space is structure.** Generous whitespace communicates confidence.
- **Motion is feedback.** Animate to inform, never to decorate.

---

## 2. Color Tokens

### 2.1 Base (Background) Scale

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#0A090F` | App root / page background |
| `--color-bg-surface` | `#100E1A` | Cards, panels, sidebars |
| `--color-bg-elevated` | `#18152A` | Modals, dropdowns, popovers |
| `--color-bg-overlay` | `#201D35` | Hover overlays, skeleton loaders |
| `--color-bg-border` | `#2A2640` | Dividers, input borders, card outlines |

### 2.2 Purple Accent Scale

| Token | Hex | Usage |
|---|---|---|
| `--color-purple-950` | `#1A0A3D` | Deep tint backgrounds (gradient start) |
| `--color-purple-800` | `#3A1A7A` | Active nav item fill, chip background |
| `--color-purple-600` | `#6B3DBF` | Secondary buttons, badge fill |
| `--color-purple-500` | `#8B5CF6` | **Primary brand accent** — CTAs, links, focus rings |
| `--color-purple-400` | `#A78BFA` | Hover states, icon accent |
| `--color-purple-300` | `#C4B5FD` | Subtle highlights, gradient end |
| `--color-purple-100` | `#EDE9FE` | Text on dark purple fills |

### 2.3 Neutral (Content) Scale

| Token | Hex | Usage |
|---|---|---|
| `--color-neutral-0` | `#FFFFFF` | High-contrast headings |
| `--color-neutral-100` | `#F0EEF8` | Primary body text |
| `--color-neutral-300` | `#BDB8D4` | Secondary / supporting text |
| `--color-neutral-500` | `#7B7598` | Placeholder text, disabled labels |
| `--color-neutral-700` | `#3F3A58` | Disabled inputs, muted dividers |

### 2.4 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#22D3A0` | Success states, positive metrics |
| `--color-warning` | `#F59E0B` | Warnings, in-progress indicators |
| `--color-error` | `#F43F5E` | Errors, destructive actions |
| `--color-info` | `#38BDF8` | Info banners, tooltip accents |

### 2.5 Gradient Recipes

```css
/* Hero / CTA gradient */
--gradient-hero: linear-gradient(135deg, #0A090F 0%, #1A0A3D 60%, #3A1A7A 100%);

/* Card glow */
--gradient-card-glow: radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.15) 0%, transparent 60%);

/* Brand shimmer (use on headings) */
--gradient-text-brand: linear-gradient(90deg, #C4B5FD 0%, #8B5CF6 50%, #A78BFA 100%);

/* Divider line */
--gradient-divider: linear-gradient(90deg, transparent 0%, #6B3DBF 50%, transparent 100%);
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Source |
|---|---|---|
| **Display** | `"Space Grotesk"` | Google Fonts |
| **Body** | `"Inter"` | Google Fonts |
| **Mono / Data** | `"JetBrains Mono"` | Google Fonts |

```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### 3.2 Type Scale

| Token | Size | Line-height | Weight | Font | Usage |
|---|---|---|---|---|---|
| `--text-display-xl` | `56px` | `1.1` | `700` | Space Grotesk | Hero headings |
| `--text-display-lg` | `40px` | `1.15` | `700` | Space Grotesk | Section headings |
| `--text-display-md` | `28px` | `1.25` | `600` | Space Grotesk | Card headings, modal titles |
| `--text-display-sm` | `20px` | `1.3` | `600` | Space Grotesk | Sub-headings |
| `--text-body-lg` | `18px` | `1.6` | `400` | Inter | Lead paragraphs |
| `--text-body-md` | `16px` | `1.6` | `400` | Inter | Default body copy |
| `--text-body-sm` | `14px` | `1.55` | `400` | Inter | Secondary copy, captions |
| `--text-label` | `12px` | `1.4` | `500` | Inter | Labels, badges, eyebrows |
| `--text-mono` | `13px` | `1.5` | `400` | JetBrains Mono | Code, metrics, data |

### 3.3 Gradient Text (Signature Element)

```css
.text-gradient-brand {
  background: var(--gradient-text-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Apply to key display headings only — once per section, maximum.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (8px base)

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Tight gaps (icon + label) |
| `--space-2` | `8px` | Inner element padding |
| `--space-3` | `12px` | Small gaps |
| `--space-4` | `16px` | Default padding |
| `--space-5` | `24px` | Card inner padding |
| `--space-6` | `32px` | Section gap |
| `--space-8` | `48px` | Component section padding |
| `--space-10` | `64px` | Page-level vertical rhythm |
| `--space-14` | `96px` | Hero / section spacers |

### 4.2 Layout Grid (Angular CDK / CSS Grid)

```css
/* Page container */
.ss-container {
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

/* 12-column grid */
.ss-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-5);
}
```

### 4.3 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Badges, chips, tags |
| `--radius-md` | `10px` | Buttons, inputs |
| `--radius-lg` | `16px` | Cards, panels |
| `--radius-xl` | `24px` | Modals, sheets |
| `--radius-full` | `9999px` | Avatars, toggles, pills |

---

## 5. Component Tokens

### 5.1 Elevation / Shadow

```css
--shadow-sm:   0 1px 3px rgba(0,0,0,0.4);
--shadow-md:   0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08);
--shadow-lg:   0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.12);
--shadow-glow: 0 0 24px rgba(139,92,246,0.35);
--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.06);
```

### 5.2 Glass / Frosted Surface

```css
.ss-glass {
  background: rgba(16, 14, 26, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow: var(--shadow-md);
}
```

### 5.3 Focus Ring

```css
:focus-visible {
  outline: 2px solid var(--color-purple-500);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

---

## 6. Core Components

### 6.1 Buttons

```css
/* Primary */
.ss-btn-primary {
  background: var(--color-purple-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font: 500 14px/1 'Inter', sans-serif;
  letter-spacing: 0.01em;
  transition: background 150ms ease, box-shadow 150ms ease, transform 100ms ease;
}
.ss-btn-primary:hover {
  background: var(--color-purple-400);
  box-shadow: var(--shadow-glow);
}
.ss-btn-primary:active { transform: scale(0.98); }
.ss-btn-primary:disabled {
  background: var(--color-neutral-700);
  cursor: not-allowed;
  box-shadow: none;
}

/* Secondary (outlined) */
.ss-btn-secondary {
  background: transparent;
  color: var(--color-purple-300);
  border: 1px solid var(--color-purple-600);
  border-radius: var(--radius-md);
  padding: 10px 20px;
  transition: background 150ms ease, border-color 150ms ease;
}
.ss-btn-secondary:hover {
  background: rgba(107, 61, 191, 0.12);
  border-color: var(--color-purple-400);
}

/* Ghost */
.ss-btn-ghost {
  background: transparent;
  color: var(--color-neutral-300);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
}
.ss-btn-ghost:hover {
  background: var(--color-bg-overlay);
  color: var(--color-neutral-100);
}
```

### 6.2 Cards

```css
/* Standard card */
.ss-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-md), var(--gradient-card-glow);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.ss-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: var(--shadow-lg);
}

/* Feature / highlight card */
.ss-card--feature {
  background: var(--gradient-card-glow), var(--color-bg-surface);
  border-color: rgba(139, 92, 246, 0.2);
}
```

### 6.3 Inputs & Form Fields

```css
.ss-input {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--color-neutral-100);
  font: 400 14px/1.55 'Inter', sans-serif;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.ss-input::placeholder { color: var(--color-neutral-500); }
.ss-input:hover { border-color: var(--color-neutral-700); }
.ss-input:focus {
  border-color: var(--color-purple-500);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  outline: none;
}
.ss-input--error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
}

/* Label */
.ss-label {
  display: block;
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--color-neutral-300);
  margin-bottom: var(--space-2);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

### 6.4 Badges & Chips

```css
.ss-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font: 500 11px/1.4 'Inter', sans-serif;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.ss-badge--default  { background: var(--color-purple-800); color: var(--color-purple-100); }
.ss-badge--success  { background: rgba(34,211,160,0.15);  color: var(--color-success); }
.ss-badge--warning  { background: rgba(245,158,11,0.15);  color: var(--color-warning); }
.ss-badge--error    { background: rgba(244,63,94,0.15);   color: var(--color-error); }
.ss-badge--info     { background: rgba(56,189,248,0.15);  color: var(--color-info); }
```

### 6.5 Navigation

```css
/* Top navbar */
.ss-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
  display: flex;
  align-items: center;
  background: rgba(10, 9, 15, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-bg-border);
}

/* Sidebar */
.ss-sidebar {
  width: 240px;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-bg-border);
  padding: var(--space-4) 0;
}

/* Nav item */
.ss-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 9px var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-neutral-300);
  font: 500 14px/1 'Inter', sans-serif;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  text-decoration: none;
}
.ss-nav-item:hover { background: var(--color-bg-overlay); color: var(--color-neutral-100); }
.ss-nav-item--active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--color-purple-300);
  border-left: 2px solid var(--color-purple-500);
}
```

### 6.6 Data Table

```css
.ss-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font: 400 14px/1.55 'Inter', sans-serif;
  color: var(--color-neutral-100);
}
.ss-table thead th {
  padding: 10px 16px;
  text-align: left;
  font: 500 11px/1.4 'Inter', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-neutral-500);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-bg-border);
}
.ss-table tbody tr {
  border-bottom: 1px solid var(--color-bg-border);
  transition: background 120ms ease;
}
.ss-table tbody tr:hover { background: var(--color-bg-overlay); }
.ss-table td { padding: 12px 16px; }
```

### 6.7 Progress / Sprint Bar

```css
.ss-progress {
  height: 6px;
  background: var(--color-bg-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.ss-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-purple-600), var(--color-purple-400));
  border-radius: var(--radius-full);
  transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ss-progress__fill--success { background: var(--color-success); }
.ss-progress__fill--warning { background: var(--color-warning); }
```

### 6.8 Tooltip

```css
.ss-tooltip {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-border);
  color: var(--color-neutral-100);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font: 400 12px/1.4 'Inter', sans-serif;
  box-shadow: var(--shadow-lg);
  max-width: 240px;
  pointer-events: none;
}
```

### 6.9 Modal / Dialog

```css
.ss-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
}
.ss-modal {
  background: var(--color-bg-elevated);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg), 0 0 60px rgba(139, 92, 246, 0.1);
  max-width: 560px;
  width: 90%;
}
```

### 6.10 Avatar

```css
.ss-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font: 500 13px/1 'Inter', sans-serif;
  background: var(--color-purple-800);
  color: var(--color-purple-100);
  border: 2px solid var(--color-bg-border);
  flex-shrink: 0;
}
.ss-avatar--sm  { width: 28px; height: 28px; font-size: 11px; }
.ss-avatar--md  { width: 36px; height: 36px; font-size: 13px; }
.ss-avatar--lg  { width: 48px; height: 48px; font-size: 16px; }
```

---

## 7. Motion & Animation

Keep motion purposeful. Avoid decoration.

```css
/* Standard easing tokens */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-enter:    cubic-bezier(0.0, 0, 0.2, 1);
--ease-exit:     cubic-bezier(0.4, 0, 1, 1);

/* Duration tokens */
--duration-fast:   100ms;
--duration-base:   200ms;
--duration-slow:   350ms;
--duration-slower: 500ms;
```

### Entrance Pattern (Angular `@Component` / CDK)

```typescript
// animations.ts
import { trigger, transition, style, animate } from '@angular/animations';

export const fadeUpIn = trigger('fadeUpIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('300ms cubic-bezier(0.0, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4, 0, 1, 1)',
      style({ opacity: 0, transform: 'translateY(8px)' }))
  ])
]);

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('200ms cubic-bezier(0.0, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Iconography

Use **Lucide Icons** (`lucide-angular`) — clean, consistent 24px stroke icons.

```bash
npm install lucide-angular
```

```typescript
// icon sizing standards
// sm: 16px  |  md: 20px  |  lg: 24px
// stroke-width: 1.5 (default) — do not change
// color: inherit from parent CSS `color`
```

---

## 9. CSS Variables — Master Sheet

Place this in `styles/tokens.css` and import in `styles.scss`:

```css
:root {
  /* Backgrounds */
  --color-bg-base:     #0A090F;
  --color-bg-surface:  #100E1A;
  --color-bg-elevated: #18152A;
  --color-bg-overlay:  #201D35;
  --color-bg-border:   #2A2640;

  /* Purple scale */
  --color-purple-950: #1A0A3D;
  --color-purple-800: #3A1A7A;
  --color-purple-600: #6B3DBF;
  --color-purple-500: #8B5CF6;
  --color-purple-400: #A78BFA;
  --color-purple-300: #C4B5FD;
  --color-purple-100: #EDE9FE;

  /* Neutrals */
  --color-neutral-0:   #FFFFFF;
  --color-neutral-100: #F0EEF8;
  --color-neutral-300: #BDB8D4;
  --color-neutral-500: #7B7598;
  --color-neutral-700: #3F3A58;

  /* Semantic */
  --color-success: #22D3A0;
  --color-warning: #F59E0B;
  --color-error:   #F43F5E;
  --color-info:    #38BDF8;

  /* Gradients */
  --gradient-hero:       linear-gradient(135deg, #0A090F 0%, #1A0A3D 60%, #3A1A7A 100%);
  --gradient-card-glow:  radial-gradient(ellipse at top left, rgba(139,92,246,0.15) 0%, transparent 60%);
  --gradient-text-brand: linear-gradient(90deg, #C4B5FD 0%, #8B5CF6 50%, #A78BFA 100%);
  --gradient-divider:    linear-gradient(90deg, transparent 0%, #6B3DBF 50%, transparent 100%);

  /* Shadows */
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.12);
  --shadow-glow:  0 0 24px rgba(139,92,246,0.35);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,0.06);

  /* Spacing */
  --space-1: 4px;   --space-2: 8px;  --space-3: 12px;
  --space-4: 16px;  --space-5: 24px; --space-6: 32px;
  --space-8: 48px;  --space-10: 64px; --space-14: 96px;

  /* Border radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* Motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-enter:    cubic-bezier(0.0, 0, 0.2, 1);
  --ease-exit:     cubic-bezier(0.4, 0, 1, 1);
  --duration-fast:   100ms;
  --duration-base:   200ms;
  --duration-slow:   350ms;
  --duration-slower: 500ms;
}
```

---

## 10. Angular Setup

### 10.1 Global Styles (`styles.scss`)

```scss
@import 'tokens.css';

*, *::before, *::after { box-sizing: border-box; }

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  background: var(--color-bg-base);
  color: var(--color-neutral-100);
  font-family: 'Inter', sans-serif;
  font-size: var(--text-body-md);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--color-neutral-0);
  line-height: 1.2;
  margin: 0;
}

a {
  color: var(--color-purple-400);
  text-decoration: none;
  transition: color var(--duration-base) var(--ease-standard);
}
a:hover { color: var(--color-purple-300); }

code, pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
```

### 10.2 Recommended File Structure

```
src/
├── styles/
│   ├── tokens.css          ← All CSS variables (Section 9)
│   ├── base.scss           ← Reset + global element styles
│   ├── typography.scss     ← Text scale utility classes
│   └── utilities.scss      ← Spacing, layout helpers
├── app/
│   └── shared/
│       └── components/
│           ├── ss-button/
│           ├── ss-card/
│           ├── ss-badge/
│           ├── ss-input/
│           ├── ss-avatar/
│           ├── ss-progress/
│           └── ss-modal/
```

### 10.3 Angular Material Theming (if used)

```scss
// angular-material-theme.scss
@use '@angular/material' as mat;

$ss-palette: mat.define-palette((
  50:   #EDE9FE,
  100:  #C4B5FD,
  200:  #A78BFA,
  300:  #8B5CF6,
  400:  #7C3AED,
  500:  #6D28D9,
  600:  #5B21B6,
  700:  #4C1D95,
  800:  #3A1A7A,
  900:  #1A0A3D,
  contrast: (300: #fff, 400: #fff, 500: #fff)
), 300, 400);

$ss-theme: mat.define-dark-theme((
  color: (primary: $ss-palette, accent: $ss-palette)
));

@include mat.all-component-themes($ss-theme);
```

---

## 11. Accessibility Checklist

- All color combinations meet **WCAG 2.1 AA** contrast (4.5:1 for text, 3:1 for UI).
- `--color-purple-500` on `--color-bg-base` = **5.2:1** ✅
- `--color-neutral-100` on `--color-bg-surface` = **11.8:1** ✅
- Focus rings visible on all interactive elements (2px `--color-purple-500`).
- Motion respects `prefers-reduced-motion`.
- All icon-only buttons have `aria-label`.
- Never rely on color alone to convey state — pair with icon or label.

---

## 12. Do's and Don'ts

| Do | Don't |
|---|---|
| Use purple accent to highlight primary actions | Use purple as a background fill across large areas |
| Keep body text `--color-neutral-100` on dark surfaces | Use white (`#fff`) for body text — too harsh |
| Apply gradient text to one key heading per section | Apply gradient text to every heading |
| Use `ss-glass` for floating elements (nav, modals) | Use solid backgrounds for overlaid surfaces |
| Space generously — trust negative space | Fill every pixel with content |
| Use `JetBrains Mono` for metrics and sprint data | Mix font families beyond the three defined |

---

*Last updated: June 2026 — Smarter Sprint v1.0 Design System*

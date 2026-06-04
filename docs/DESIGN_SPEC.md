# Design Specification: Church Bookstore Main Page Redesign

> **Status:** Implementation-ready  
> **Scope:** Main page (`app/page.tsx`) and shared components (`Header`, `Hero`, `Footer`, `ProductCard`, category section, features section)  
> **Stack:** Next.js + Tailwind CSS  
> **Last Updated:** 2026-05-06

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Design System — Orthodox-Inspired Palette](#2-design-system--orthodox-inspired-palette)
3. [Surface Hierarchy](#3-surface-hierarchy)
4. [Tailwind Config Changes](#4-tailwind-config-changes)
5. [CSS Variable Updates](#5-css-variable-updates)
6. [Global CSS Component Class Updates](#6-global-css-component-class-updates)
7. [Component Specifications](#7-component-specifications)
8. [Button System](#8-button-system)
9. [Typography Enhancement](#9-typography-enhancement)
10. [60-30-10 Color Distribution](#10-60-30-10-color-distribution)
11. [Issue-to-Change Mapping](#11-issue-to-change-mapping)
12. [Implementation Checklist](#12-implementation-checklist)

---

## 1. Problem Statement

A design review identified **5 critical issues** with the current main page:

| # | Issue | Root Cause |
|---|-------|-----------|
| 1 | Too many competing background tiers | White navbar + cream page + white cards + black footer = 4 disjointed surface levels |
| 2 | Jarring black footer with no transition | `bg-dark #242424` (cold black) abruptly follows warm cream |
| 3 | White-on-white category cards with poor visibility | `bg-white` cards on `bg-amber-50/30` section — insufficient contrast |
| 4 | No accent/brand color — reads as generic SaaS template | Red `#D92022` is used sparingly; no cohesive secondary/accent system |
| 5 | 60-30-10 color rule broken | ~90% white/cream, ~10% black, ~0% accent — no visual hierarchy |

**Additional technical issue:** CSS variable conflict — [`globals.css`](app/globals.css:143) defines `--color-primary: #8b2f2f` (dark maroon) which conflicts with [`tailwind.config.js`](tailwind.config.js:11) `primary: '#D92022'` (bright red).

---

## 2. Design System — Orthodox-Inspired Palette

### 2.1 Parchment Family (60% — Dominant)

Warm, parchment-toned surfaces inspired by liturgical manuscripts. Replaces all pure white and cold grays.

| Token | Hex | Usage |
|-------|-----|-------|
| `parchment` | `#F5F0E8` | Main page background, header background |
| `parchment-light` | `#FBF8F3` | Card/panel backgrounds, dropdowns, raised surfaces |
| `parchment-dark` | `#E8DFD0` | Alternate section backgrounds, gradient endpoints, borders |

### 2.2 Burgundy Family (30% — Secondary)

Deep liturgical red, inspired by Orthodox vestments and icon backgrounds. Replaces the cold `#242424` black and the generic `#D92022` red.

| Token | Hex | Usage |
|-------|-----|-------|
| `burgundy` | `#A01830` | Brand color, footer background, heading accents, nav highlights |
| `burgundy-dark` | `#6E0E1E` | Hover states, deep accents |
| `burgundy-light` | `#C03050` | Subtle accents, light burgundy backgrounds at 10% opacity |
| `burgundy-muted` | `#B05060` | Muted burgundy for secondary text on dark backgrounds |

### 2.3 Gold Family (10% — Accent)

Liturgical gold for highlights and calls-to-action. Replaces the generic orange `#FF9901` and scattered red CTAs.

| Token | Hex | Usage |
|-------|-----|-------|
| `gold` | `#DDB020` | CTA buttons, prices, key highlights, decorative elements |
| `gold-light` | `#ECC840` | Hover states on gold elements |
| `gold-dark` | `#D09010` | Pressed/active states |
| `gold-muted` | `#D0A830` | Subtle gold text |

### 2.4 Ink Family (Text)

Warm text colors that harmonize with parchment. Replaces the cold `#242424` text.

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | `#2C1810` | Primary text — warm near-black |
| `ink-light` | `#6B5B4E` | Secondary text — warm brown-gray |
| `ink-muted` | `#9B8E82` | Muted/placeholder text |

---

## 3. Surface Hierarchy

**Fixes Issue #1** (too many competing background tiers).

The redesign uses exactly **3 surface levels**, all warm-toned:

```
┌─────────────────────────────────────────────┐
│  BASE — parchment #F5F0E8                   │
│  Page background, header background          │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  RAISED — parchment-light #FBF8F3       │ │
│  │  Cards, panels, dropdowns               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ...content scrolls...                        │
│                                              │
│  ══════════ border-t-2 border-gold/30 ══════ │
│  ┌─────────────────────────────────────────┐ │
│  │  DEEP — burgundy #A01830                │ │
│  │  Footer only                             │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

| Level | Background | Role | Replaces |
|-------|-----------|------|----------|
| Base | `parchment` `#F5F0E8` | Page bg, header bg | `background: #F3EFE8` + `bg-white/95` |
| Raised | `parchment-light` `#FBF8F3` | Cards, panels, dropdowns | `bg-white` cards + `bg-amber-50/30` |
| Deep | `burgundy` `#A01830` | Footer only | `bg-dark #242424` |

**Key principle:** The header uses `bg-parchment/95 backdrop-blur-sm` — same color family as the page background — so it blends seamlessly instead of creating a separate visual tier.

---

## 4. Tailwind Config Changes

File: [`tailwind.config.js`](tailwind.config.js)

Replace the entire `colors` block (lines 9–31) with:

```js
colors: {
  // REMOVE: primary, dark, background, accent, gray custom colors
  
  // Parchment family (60% — dominant surfaces)
  parchment: {
    DEFAULT: '#F5F0E8',
    light: '#FBF8F3',
    dark: '#E8DFD0',
  },
  
  // Burgundy family (30% — secondary/brand)
  burgundy: {
    DEFAULT: '#A01830',
    dark: '#6E0E1E',
    light: '#C03050',
    muted: '#B05060',
  },
  
  // Gold family (10% — accent)
  gold: {
    DEFAULT: '#DDB020',
    light: '#ECC840',
    dark: '#D09010',
    muted: '#D0A830',
  },
  
  // Ink family (text)
  ink: {
    DEFAULT: '#2C1810',
    light: '#6B5B4E',
    muted: '#9B8E82',
  },
},
```

**What gets removed:**
- `primary` (`#D92022`, `#BB1314`, `#C66263`) — replaced by burgundy/gold
- `dark` (`#242424`, `#24090E`) — replaced by burgundy for footer, ink for text
- `background` (`#F3EFE8`, `#E9E3D8`) — replaced by parchment
- `accent` (`#FF9901`, `#8DD0A4`) — replaced by gold
- `gray` (`#373839`, `#9B9B9B`, `#DADADA`) — replaced by ink family

---

## 5. CSS Variable Updates

File: [`app/globals.css`](app/globals.css:142)

### 5.1 Replace `:root` CSS custom properties

**Remove** (line 142–144):
```css
:root {
  --color-primary: #8b2f2f;
}
```

**Replace with:**
```css
:root {
  --color-burgundy: #A01830;
  --color-gold: #DDB020;
  --color-ink: #2C1810;
  --color-parchment: #F5F0E8;
}
```

### 5.2 Update `:root` RGB variables

**Change** (lines 7–11):
```css
:root {
  --foreground-rgb: 36, 36, 36;
  --background-start-rgb: 243, 239, 232;
  --background-end-rgb: 233, 227, 216;
}
```

**To:**
```css
:root {
  --foreground-rgb: 44, 24, 16;         /* ink #2C1810 */
  --background-start-rgb: 245, 240, 232; /* parchment #F5F0E8 */
  --background-end-rgb: 232, 223, 208;   /* parchment-dark #E8DFD0 */
}
```

### 5.3 Update all `var(--color-primary, #8b2f2f)` references

In [`globals.css`](app/globals.css), replace every occurrence of:
- `var(--color-primary, #8b2f2f)` → `var(--color-burgundy, #A01830)`

This affects lines 60, 68, 96.

---

## 6. Global CSS Component Class Updates

File: [`app/globals.css`](app/globals.css:24)

### 6.1 `.btn-primary` (line 25–29)

**Before:**
```css
.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-lg font-medium 
         hover:bg-primary-dark transition-colors duration-200
         active:scale-95 transform;
}
```

**After:**
```css
.btn-primary {
  @apply bg-gold text-ink px-6 py-3 rounded-lg font-medium 
         hover:bg-gold-light transition-colors duration-200
         active:scale-95 transform;
}
```

### 6.2 `.btn-secondary` (line 31–35)

**Before:**
```css
.btn-secondary {
  @apply border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium
         hover:bg-primary hover:text-white transition-colors duration-200
         active:scale-95 transform;
}
```

**After:**
```css
.btn-secondary {
  @apply border-2 border-burgundy text-burgundy px-6 py-3 rounded-lg font-medium
         hover:bg-burgundy hover:text-parchment-light transition-colors duration-200
         active:scale-95 transform;
}
```

### 6.3 `.card` (line 37–39)

**Before:**
```css
.card {
  @apply bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200;
}
```

**After:**
```css
.card {
  @apply bg-parchment-light rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200;
}
```

### 6.4 `.section-title` (line 41–43)

**Before:**
```css
.section-title {
  @apply text-3xl md:text-4xl font-bold text-dark mb-8;
}
```

**After:**
```css
.section-title {
  @apply text-3xl md:text-4xl font-bold text-ink mb-8 font-display;
}
```

---

## 7. Component Specifications

### 7.1 Header

File: [`app/components/Header.tsx`](app/components/Header.tsx)

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-white/95 backdrop-blur-sm` | `bg-parchment/95 backdrop-blur-sm` |
| Border bottom | none | `border-b border-parchment-dark/50` |
| Text/links | `text-gray-700` / `text-dark` | `text-ink` |
| Nav link hover | `hover:text-primary` | `hover:text-burgundy` |
| Cart badge | `bg-primary text-white` | `bg-gold text-ink` |
| Dropdown bg | `bg-white` | `bg-parchment-light` |
| Dropdown shadow | `shadow-lg` | `shadow-lg` (unchanged) |
| Mobile menu bg | `bg-white` | `bg-parchment-light` |
| Logo text | `text-dark` | `text-ink` |
| Search icon | `text-gray-500` | `text-ink-light` |

### 7.2 Hero

File: [`app/components/Hero.tsx`](app/components/Hero.tsx)

| Element | Current | New |
|---------|---------|-----|
| Background | gradient `#F3EFE8` → `#E9E3D8` | `bg-gradient-to-b from-parchment to-parchment-dark` |
| Heading text | `text-dark` | `text-ink font-display` |
| "Bookstore" span | `text-primary` | `text-burgundy` |
| Subtitle | `text-gray-600` | `text-ink-light` |
| CTA button | `bg-primary hover:bg-primary-dark text-white` | `bg-gold hover:bg-gold-light text-ink` |
| Stats numbers | `text-primary` | `text-gold` |
| Stats labels | `text-gray-600` | `text-ink-light` |
| Decorative blur 1 | `bg-red-200/30` | `bg-burgundy/10` |
| Decorative blur 2 | `bg-orange-200/30` | `bg-gold/10` |

### 7.3 Category Cards Section

File: [`app/page.tsx`](app/page.tsx) (inline category section)

**Fixes Issue #3** (white-on-white poor visibility).

| Element | Current | New |
|---------|---------|-----|
| Section background | `bg-amber-50/30` | `bg-parchment-dark/50` |
| Section title | `text-dark` | `text-ink font-display` |
| Card background | `bg-white border-gray-200` | `bg-parchment-light border border-parchment-dark/30` |
| Card hover | `hover:shadow-lg` | `hover:border-gold/50 hover:shadow-md` |
| Icon circle | `bg-red-50 text-red-600` | `bg-burgundy/10 text-burgundy` |
| Icon circle hover | `bg-red-600 text-white` | `group-hover:bg-burgundy group-hover:text-parchment-light` |
| Category title | `text-dark` | `text-ink` |
| Category title hover | `text-primary` | `group-hover:text-burgundy` |
| Child count | `text-gray-500` | `text-ink-muted` |
| Child chips | `bg-gray-100 text-gray-600` | `bg-parchment text-ink-light border border-parchment-dark/20` |
| Chip hover | `hover:bg-gray-200` | `hover:bg-burgundy/10 hover:text-burgundy hover:border-burgundy/30` |

### 7.4 Product Cards

File: [`app/components/ProductCard.tsx`](app/components/ProductCard.tsx)

| Element | Current | New |
|---------|---------|-----|
| Card background | `bg-white` | `bg-parchment-light` |
| Card shadow | `shadow-sm` | `shadow-sm` (unchanged) |
| Card hover shadow | `hover:shadow-md` | `hover:shadow-md` (unchanged) |
| "New" badge | `bg-green-500 text-white` | `bg-gold text-ink` |
| "Sale" badge | `bg-red-500 text-white` | `bg-burgundy text-parchment-light` |
| Title | `text-dark` | `text-ink` |
| Title hover | `text-primary` | `text-burgundy` |
| Author | `text-gray-600` | `text-ink-light` |
| Price | `text-dark font-bold` | `text-gold-dark font-bold` |
| Original price | `text-gray-400 line-through` | `text-ink-muted line-through` |
| Book type icon | `text-red-500` | `text-burgundy` |
| Rating stars | `text-yellow-400` | `text-gold` |
| "Add to cart" button | `bg-primary hover:bg-primary-dark text-white` | `bg-gold hover:bg-gold-light text-ink` |

### 7.5 Features Section

File: [`app/page.tsx`](app/page.tsx) (inline features section)

| Element | Current | New |
|---------|---------|-----|
| Section background | default (white/cream) | default (`parchment`) |
| Section title | `text-dark` | `text-ink font-display` |
| Icon circle | `bg-red-50 text-red-600` | `bg-burgundy/10 text-burgundy` |
| Feature title | `text-dark` | `text-ink` |
| Feature description | `text-gray-600` | `text-ink-light` |

### 7.6 Footer

File: [`app/components/Footer.tsx`](app/components/Footer.tsx)

**Fixes Issue #2** (jarring black footer with no transition).

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-dark #242424` | `bg-burgundy #A01830` |
| Top border | none | `border-t-2 border-gold/30` (gold transition line) |
| Logo text | `text-white` | `text-parchment font-display` |
| Description text | `text-gray-400` | `text-parchment/70` |
| Section headings | `text-white` | `text-parchment` |
| Link text | `text-gray-400` | `text-parchment/70` |
| Link hover | `hover:text-white` | `hover:text-gold` |
| Contact icons | `text-primary` | `text-gold` |
| Social buttons | `bg-gray-800 hover:bg-primary` | `bg-parchment/10 hover:bg-gold hover:text-burgundy` |
| Divider | `border-gray-800` | `border-parchment/10` |
| Copyright | `text-gray-500` | `text-parchment/50` |

---

## 8. Button System

### 8.1 Primary CTA (Gold)

```html
<button class="bg-gold text-ink px-6 py-3 rounded-lg font-medium 
               hover:bg-gold-light transition-colors duration-200 
               active:scale-95 transform">
  Shop Now
</button>
```

Use for: Hero CTA, "Add to Cart", any primary action.

### 8.2 Secondary CTA (Burgundy Outline)

```html
<button class="border-2 border-burgundy text-burgundy px-6 py-3 rounded-lg font-medium
               hover:bg-burgundy hover:text-parchment-light 
               transition-colors duration-200 
               active:scale-95 transform">
  View Catalog
</button>
```

Use for: "View All", "Learn More", secondary actions.

### 8.3 Icon Buttons (e.g., social, cart)

```html
<button class="bg-parchment/10 hover:bg-gold hover:text-burgundy 
               transition-colors duration-200 rounded-full p-2">
  <!-- icon -->
</button>
```

Use for: Footer social links, utility icon buttons on dark backgrounds.

---

## 9. Typography Enhancement

### 9.1 Font Families

The existing [`tailwind.config.js`](tailwind.config.js:33) already defines both families:

```js
fontFamily: {
  display: ['Georgia', 'serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
},
```

### 9.2 Where to Use `font-display`

Apply `font-display` (Georgia, serif) to these elements for a liturgical, traditional feel:

| Component | Element | Class |
|-----------|---------|-------|
| Hero | Main heading | `font-display` |
| Categories | Section title | `font-display` |
| Features | Section title | `font-display` |
| Footer | Logo/brand text | `font-display` |
| `.section-title` | Global class | Add `font-display` |

### 9.3 Body Text

Keep `font-body` (Inter) for all other text — product titles, descriptions, navigation, prices, body copy. This is already the default via [`globals.css`](app/globals.css:21) `font-family: 'Inter', system-ui, sans-serif`.

---

## 10. 60-30-10 Color Distribution

### 10.1 Target Distribution

| Role | Color Family | Target % | Actual Surfaces |
|------|-------------|----------|-----------------|
| Dominant (60%) | Parchment | ~60% | Page bg, card bg, header bg, modal bg, dropdown bg |
| Secondary (30%) | Burgundy | ~30% | Footer, heading accents, nav hover, category icons, badges, hover states, section dividers |
| Accent (10%) | Gold | ~10% | CTA buttons, prices, decorative blurs, social icons, cart badge, highlights |

### 10.2 Visual Distribution Map

```
┌──────────────────────────────────────────────────┐
│  HEADER — parchment/95                    [60%]  │
│  nav links → burgundy on hover             [30%] │
│  cart badge → gold                         [10%] │
├──────────────────────────────────────────────────┤
│  HERO — parchment gradient                 [60%] │
│  heading accent → burgundy                 [30%] │
│  CTA button, stats → gold                  [10%] │
├──────────────────────────────────────────────────┤
│  CATEGORIES — parchment-dark/50 bg         [60%] │
│  icon circles, title hover → burgundy      [30%] │
│  card hover border → gold                  [10%] │
├──────────────────────────────────────────────────┤
│  PRODUCTS — parchment bg                   [60%] │
│  badges, hover → burgundy                  [30%] │
│  prices, add-to-cart → gold                [10%] │
├──────────────────────────────────────────────────┤
│  FEATURES — parchment bg                   [60%] │
│  icon circles → burgundy                   [30%] │
│  (no gold in this section)                 [ 0%] │
├══════════════════════════════════════════════════╡
│  GOLD TRANSITION LINE — border-gold/30     [10%] │
├──────────────────────────────────────────────────┤
│  FOOTER — burgundy bg                      [30%] │
│  text → parchment                          [60%] │
│  social hover, contact icons → gold        [10%] │
└──────────────────────────────────────────────────┘
```

---

## 11. Issue-to-Change Mapping

### Issue #1: Too many competing background tiers

**Changes:**
- Reduce from 4 tiers (white, cream, white, black) to 3 tiers (parchment, parchment-light, burgundy)
- Header changes from `bg-white/95` to `bg-parchment/95` — same family as page bg
- Cards change from `bg-white` to `bg-parchment-light` — warm white, not pure white
- Footer changes from `bg-dark #242424` to `bg-burgundy #A01830` — warm dark, not cold black
- **Files:** [`Header.tsx`](app/components/Header.tsx), [`ProductCard.tsx`](app/components/ProductCard.tsx), [`Footer.tsx`](app/components/Footer.tsx), [`page.tsx`](app/page.tsx), [`globals.css`](app/globals.css)

### Issue #2: Jarring black footer with no transition

**Changes:**
- Footer background: `bg-dark #242424` → `bg-burgundy #A01830` (warm, not cold)
- Add decorative gold transition line: `border-t-2 border-gold/30`
- Footer text: `text-gray-*` → `text-parchment` / `text-parchment/70` (warm cream on warm burgundy)
- **Files:** [`Footer.tsx`](app/components/Footer.tsx)

### Issue #3: White-on-white category cards with poor visibility

**Changes:**
- Section background: `bg-amber-50/30` → `bg-parchment-dark/50` (distinct from page bg)
- Card background: `bg-white` → `bg-parchment-light` (warm white)
- Card border: `border-gray-200` → `border border-parchment-dark/30` (warm, visible border)
- Card hover: add `hover:border-gold/50` for gold-tinted hover feedback
- **Files:** [`page.tsx`](app/page.tsx) (category section)

### Issue #4: No accent/brand color — reads as generic SaaS template

**Changes:**
- Introduce burgundy as the brand color: footer, headings, nav accents, category icons
- Introduce gold as the accent color: CTAs, prices, highlights, decorative elements
- Remove generic red (`#D92022`) and generic orange (`#FF9901`)
- Add `font-display` (Georgia) for headings to reinforce traditional character
- **Files:** [`tailwind.config.js`](tailwind.config.js), all component files

### Issue #5: 60-30-10 color rule broken

**Changes:**
- Parchment family fills ~60%: page bg, card bg, header bg, all large surface areas
- Burgundy family fills ~30%: footer, headings, icons, badges, hover states
- Gold family fills ~10%: CTAs, prices, decorative elements, social icons
- **Files:** All component files, [`tailwind.config.js`](tailwind.config.js)

---

## 12. Implementation Checklist

This is the ordered sequence of changes for the implementer:

### Phase 1: Foundation

- [ ] Update [`tailwind.config.js`](tailwind.config.js) — replace `colors` block with parchment/burgundy/gold/ink families
- [ ] Update [`app/globals.css`](app/globals.css) — replace `:root` CSS variables (RGB values + custom properties)
- [ ] Update [`app/globals.css`](app/globals.css) — replace all `var(--color-primary, #8b2f2f)` with `var(--color-burgundy, #A01830)`
- [ ] Update [`app/globals.css`](app/globals.css) — update `.btn-primary`, `.btn-secondary`, `.card`, `.section-title` component classes

### Phase 2: Shared Components

- [ ] Update [`app/components/Header.tsx`](app/components/Header.tsx) — background, text, hover, badge, dropdown colors
- [ ] Update [`app/components/Hero.tsx`](app/components/Hero.tsx) — background gradient, heading, CTA, stats, decorative blurs
- [ ] Update [`app/components/Footer.tsx`](app/components/Footer.tsx) — background, border, text, links, social buttons, dividers
- [ ] Update [`app/components/ProductCard.tsx`](app/components/ProductCard.tsx) — card bg, badges, title, author, price, button colors

### Phase 3: Page Sections

- [ ] Update category section in [`app/page.tsx`](app/page.tsx) — section bg, card bg/border/hover, icon circles, chips
- [ ] Update features section in [`app/page.tsx`](app/page.tsx) — icon circles, title, description colors
- [ ] Update any remaining sections in [`app/page.tsx`](app/page.tsx) that reference old color tokens

### Phase 4: Verification

- [ ] Search entire codebase for old color tokens (`primary`, `dark`, `background`, `accent.orange`, `accent.green`, `gray.custom`, `gray.light`, `gray.lighter`, `bg-white`, `text-gray-*`, `border-gray-*`) and update
- [ ] Verify no remaining references to `#D92022`, `#BB1314`, `#242424`, `#8b2f2f`
- [ ] Visual QA — check header blends with page, footer transitions smoothly, category cards are visible, gold CTAs stand out

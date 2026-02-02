# Gonzales - Tech Styleguide

Design reference for the Liquid Glass design system used in Gonzales.

---

## Color Palette

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--g-blue` | `#007AFF` | Download speeds, primary actions, links |
| `--g-green` | `#34C759` | Upload speeds, success states, complete phase |
| `--g-red` | `#FF3B30` | Errors, violations, degradation alerts |
| `--g-orange` | `#FF9500` | Ping/latency, warnings, ping phase |
| `--g-purple` | `#AF52DE` | Reserved for future use |
| `--g-teal` | `#5AC8FA` | ISP score, initializing phase, secondary info |

### Color Tints (10% opacity, for backgrounds)

| Token | Usage |
|-------|-------|
| `--g-blue-tint` | `rgba(0, 122, 255, 0.10)` |
| `--g-green-tint` | `rgba(52, 199, 89, 0.10)` |
| `--g-red-tint` | `rgba(255, 59, 48, 0.10)` |
| `--g-orange-tint` | `rgba(255, 149, 0, 0.10)` |
| `--g-purple-tint` | `rgba(175, 82, 222, 0.10)` |
| `--g-teal-tint` | `rgba(90, 200, 250, 0.10)` |

### Text Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--g-text` | `#1D1D1F` | `#F5F5F7` | Primary text |
| `--g-text-secondary` | `#86868B` | `#98989D` | Labels, descriptions |
| `--g-text-tertiary` | `#AEAEB2` | `#636366` | Hints, timestamps, units |

### Surface Colors

| Token | Light | Dark |
|-------|-------|------|
| `--g-bg` | `#F2F2F7` | `#1C1C1E` |
| `--g-card-bg` | `rgba(255,255,255,0.60)` | `rgba(44,44,46,0.60)` |
| `--g-card-border` | `rgba(255,255,255,0.80)` | `rgba(255,255,255,0.08)` |
| `--g-border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` |

---

## Typography

### Font Stack

```css
--g-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
  'Helvetica Neue', Helvetica, Arial, sans-serif;
```

### Size Scale

| Token | Size | Usage |
|-------|------|-------|
| `--g-text-xs` | `0.6875rem` (11px) | Badges, timestamps, units |
| `--g-text-sm` | `0.8125rem` (13px) | Secondary text, table cells |
| `--g-text-base` | `0.875rem` (14px) | Body text, labels |
| `--g-text-lg` | `1rem` (16px) | Card titles |
| `--g-text-xl` | `1.125rem` (18px) | Section titles |
| `--g-text-2xl` | `1.375rem` (22px) | Page headers |
| `--g-text-3xl` | `1.75rem` (28px) | Large numbers |
| `--g-text-4xl` | `2.25rem` (36px) | Hero numbers |
| `--g-text-5xl` | `3rem` (48px) | Dashboard gauges |

### Weight Conventions

- **400 (normal)**: Body text, descriptions
- **500 (medium)**: Labels, navigation items
- **600 (semibold)**: Card titles, metric labels
- **700 (bold)**: Page headers, large numbers, emphasis

---

## Spacing

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--g-space-1` | `4px` | Tight gaps (icon-text) |
| `--g-space-2` | `8px` | Small gaps, inline padding |
| `--g-space-3` | `12px` | Card padding (sm) |
| `--g-space-4` | `16px` | Card padding (md), section gaps |
| `--g-space-5` | `20px` | Card padding (lg) |
| `--g-space-6` | `24px` | Section spacing |
| `--g-space-8` | `32px` | Large section spacing |
| `--g-space-10` | `40px` | Page padding |
| `--g-space-12` | `48px` | Hero spacing |
| `--g-space-16` | `64px` | Maximum spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--g-radius-sm` | `8px` | Inputs, small buttons, badges |
| `--g-radius-md` | `12px` | Cards, dropdowns |
| `--g-radius-lg` | `16px` | Large cards, dialogs |
| `--g-radius-xl` | `20px` | Feature cards |
| `--g-radius-2xl` | `24px` | Hero sections |
| `--g-radius-full` | `9999px` | Pills, circular elements |

---

## Shadow System

Four levels of elevation:

| Level | Token | Usage |
|-------|-------|-------|
| Subtle | `--g-shadow-subtle` | Default card, resting state |
| Medium | `--g-shadow-medium` | Hovered card, active element |
| Elevated | `--g-shadow-elevated` | Floating card, dropdown, modal |
| Floating | `--g-shadow-floating` | Tooltip, context menu, overlay |

### Light Mode Values

```css
--g-shadow-subtle:   0 1px 4px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06);
--g-shadow-medium:   0 2px 16px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);
--g-shadow-elevated: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
--g-shadow-floating: 0 16px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08);
```

---

## Glass Effect

The Liquid Glass system uses multi-layer translucency:

### Blur Levels

| Token | Value | Usage |
|-------|-------|-------|
| `--g-glass-blur` | `blur(20px) saturate(180%)` | Standard glass effect |
| `--g-glass-blur-heavy` | `blur(40px) saturate(200%)` | Sidebar, overlays |

### Glass Backgrounds

| Token | Usage |
|-------|-------|
| `--g-glass-bg-subtle` | Tooltip, light overlays |
| `--g-glass-bg` | Default glass overlay |
| `--g-glass-bg-strong` | Heavy overlays, modals |

### Depth Layers (multi-layer card)

Each glass card has three visual layers:

1. **`::before`** -- Shine (top highlight gradient)
2. **`::after`** -- Edge refraction (bottom edge gradient)
3. **`box-shadow`** -- Inner shadow for inset depth

### Card Depth Variants

```tsx
<GlassCard depth="subtle" />    // shadow-subtle
<GlassCard depth="default" />   // shadow-medium (default)
<GlassCard depth="elevated" />  // shadow-elevated
<GlassCard depth="floating" />  // shadow-floating
```

---

## Glass UI Components

### GlassCard

Container with translucent glass background and multi-layer depth.

```tsx
<GlassCard padding="none|sm|md|lg" depth="subtle|default|elevated|floating">
  {children}
</GlassCard>
```

### GlassButton

Button with glass styling. Supports ripple effect on click.

```tsx
<GlassButton size="sm|md" onClick={handler} className="glass-btn-primary">
  Label
</GlassButton>
```

- Primary variant: `glass-btn-primary` class
- Ripple effect tracks click position via CSS vars

### GlassInput

Text input with glass background and focus ring.

```tsx
<GlassInput value={val} onChange={handler} placeholder="..." />
```

### GlassBadge

Small status indicator with colored text and tinted background.

```tsx
<GlassBadge color="var(--g-green)">Active</GlassBadge>
```

### GlassSelect

Dropdown select with glass styling and hover highlight.

### Spinner

Loading indicator using CSS spin animation.

```tsx
<Spinner size={24} />
```

### Skeleton / SkeletonCard

Shimmer loading placeholder.

```tsx
<Skeleton width="100%" height="20px" />
<SkeletonCard />
```

---

## Animation System

### Keyframes

| Name | Effect | Duration |
|------|--------|----------|
| `g-fade-in` | Opacity 0 + translateY(8px) to visible | 250ms |
| `g-scale-in` | Scale 0.95 + opacity to visible | 250ms |
| `g-slide-in-right` | translateX(16px) to visible | 250ms |
| `g-slide-in-left` | translateX(-16px) to visible | 250ms |
| `g-slide-in-up` | translateY(100%) to position | 250ms |
| `g-shimmer` | Background position shift | 2s+ |
| `g-spin` | 360deg rotation | continuous |
| `g-ripple` | Scale 0 to 4 with fade | 600ms |
| `g-float` | translateY 0 to -4px | 3s |
| `g-breathe` | Opacity 0.6 to 1 | 2s |
| `g-pulse-glow` | Box-shadow pulse | 2s |
| `g-phase-enter` | Scale(0.9) + blur(4px) to normal | 400ms |
| `g-number-glow-pulse` | Pulsing text-shadow via `--glow-color` | 2s |

### Utility Classes

| Class | Animation |
|-------|-----------|
| `g-animate-in` | Fade in with slight upward slide |
| `g-animate-scale` | Scale in with spring easing |
| `g-animate-slide-right` | Slide in from right |
| `g-animate-slide-left` | Slide in from left |
| `g-animate-float` | Gentle floating motion |
| `g-animate-breathe` | Pulsing opacity |
| `g-phase-enter` | Phase transition entrance (scale + blur) |
| `g-number-glow-pulse` | Speed number glow pulse (uses `--glow-color` CSS var) |

### Stagger Delays

Classes `g-stagger-1` through `g-stagger-10` add 50ms increments of delay (50ms to 500ms).

### Duration Modifiers

| Class | Duration |
|-------|----------|
| `g-duration-fast` | 150ms |
| `g-duration-normal` | 250ms |
| `g-duration-slow` | 400ms |

### Easing Curves

| Token | Curve | Usage |
|-------|-------|-------|
| `--g-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions (scale, buttons) |
| `--g-ease-out` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Standard exit animations |
| `--g-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Number animations, fast decel |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`. Animations are disabled, opacity and transforms reset to defaults.

---

## Hover Interactions

### Cards

```css
.glass-card-hover:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--g-shadow-elevated);
}
```

### Buttons

- Press: `scale(0.97)` with spring easing
- Ripple: radial gradient at click position

### Table Rows

- Hover: Blue tint background (`--g-blue-tint`)

### Navigation Items

- Hover: Icon shift + label glow
- Active: Left accent border + glow

---

## Icons

**Library**: Lucide React (https://lucide.dev)

### Size Conventions

| Context | Size | Class |
|---------|------|-------|
| Inline text | 14px | `w-3.5 h-3.5` |
| Button icon | 16px | `w-4 h-4` |
| Card header | 16-20px | `w-4 h-4` to `w-5 h-5` |
| Feature icon | 24px | `w-6 h-6` |
| Hero icon | 32px | `w-8 h-8` |

### Color Rules

- Icons inherit text color by default
- Use accent colors for emphasis: `style={{ color: "var(--g-blue)" }}`
- No emojis anywhere -- exclusively Lucide icons

---

## Responsive Breakpoints

Using Tailwind CSS 4 defaults:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--g-sidebar-width` | `224px` | Desktop sidebar |
| `--g-sidebar-collapsed` | `64px` | Collapsed sidebar |
| `--g-header-height` | `56px` | Top header bar |
| `--g-mobile-nav-height` | `64px` | Bottom mobile nav |

### Responsive Behavior

- **Mobile** (< 768px): Bottom tab navigation, single column
- **Tablet** (768-1024px): Sidebar + content, 2-column grids
- **Desktop** (> 1024px): Full sidebar + content, 3-column grids

---

## Theme System

### Implementation

Theme is controlled by `data-theme` attribute on `<html>`:

- `data-theme="light"` -- Force light mode
- `data-theme="dark"` -- Force dark mode
- No attribute -- Follow system preference via `prefers-color-scheme`

### CSS Pattern

```css
:root { /* Light mode defaults */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* Dark overrides */ }
}
[data-theme="dark"] { /* Explicit dark overrides */ }
```

### Theme Hook

```tsx
const { theme, setTheme, resolvedTheme } = useTheme();
// theme: "auto" | "light" | "dark"
// resolvedTheme: "light" | "dark" (actual applied theme)
```

---

## Chart Styling

### Library: Recharts

- Animation: `animationDuration={800-1000}`, `animationBegin` staggered by 200ms
- Easing: `animationEasing="ease-out"`
- Grid: `strokeDasharray="3 3"`, `stroke="var(--g-border)"`
- Axes: `fontSize: 11`, `stroke="var(--g-text-tertiary)"`
- Tooltips: Glass-styled with `backdropFilter: "blur(20px)"`

### Color Mapping

| Metric | Color |
|--------|-------|
| Download | `var(--g-blue)` |
| Upload | `var(--g-green)` |
| Ping | `var(--g-orange)` |
| Jitter | `var(--g-purple)` |

---

## TUI Style Reference

### Color Palette (Neon / Demoscene)

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00ffff` | Download, headers, primary |
| Magenta | `#ff00ff` | Upload, labels, accent |
| Yellow | `#ffff00` | Ping, status messages |
| Green | `#00ff00` | Success, countdown |
| Red | `#ff3333` | Errors, packet loss |
| White | `#e0e0e0` | Default text |
| Gray | `#888888` | Secondary info |

### Background

- Screen: `#0a0a0a`
- Header/Footer: `#1a1a2e`
- Table cursor: `#2a2a4e`
- Input: `#1a1a2e` with `#333366` border

### ASCII Elements

- Gauge bars: `█` (filled) + `░` (empty)
- Gradient blocks: ` ░▒▓█`
- Sparkline: `▁▂▃▄▅▆▇█`
- Box drawing: `╔═╗║╚╝╠╣`
- Big speed digits: 3-line-tall, 5-char-wide block characters (big_speed.py)
- Data flow: scrolling `. : | ! * # = █ ░ ▒ ▓` characters, density scales with bandwidth

### Screens

| Key | Screen | Description |
|-----|--------|-------------|
| `D` | Dashboard | Gauges, sparklines, countdown |
| `H` | History | DataTable with measurements |
| `S` | Settings | Input fields for config |
| `T` | Test | Real-time live gauge with event bus |
| `Q` | Quit | Exit application |

---

## Do's and Don'ts

### Do

- Use CSS custom properties for all colors (never hardcode hex in components)
- Use `GlassCard` as the base container for all content sections
- Use `tabular-nums` class for numeric displays
- Use `g-animate-in` with stagger for list/grid entrance
- Use Lucide icons at consistent sizes
- Respect reduced motion preferences
- Use `var(--g-text-secondary)` for labels, `var(--g-text-tertiary)` for hints

### Don't

- Don't use emojis anywhere in the UI
- Don't use opaque backgrounds (always use glass/translucent)
- Don't skip the depth system (always specify `depth` on important cards)
- Don't hardcode animation durations (use `--g-duration-*` tokens)
- Don't add `!important` to override glass styles
- Don't use `box-shadow` directly (use `--g-shadow-*` tokens)
- Don't use non-Lucide icon libraries

---

## File Structure

```
frontend/src/design-system/
  tokens.css         # All CSS custom properties
  liquid-glass.css   # Glass component styles
  animations.css     # Keyframes and utility classes

frontend/src/components/ui/
  GlassCard.tsx      # Container with depth variants
  GlassButton.tsx    # Button with ripple effect
  GlassInput.tsx     # Input with focus ring
  GlassBadge.tsx     # Status badge
  GlassSelect.tsx    # Dropdown select
  Spinner.tsx        # Loading indicator
  Skeleton.tsx       # Shimmer placeholder
  Logo.tsx           # App logo
```

# Lucky Goal Design System — "The Kinetic Stadium"

Generated via Google Stitch SDK. This system merges high-stakes sports adrenaline
with the neon-soaked aesthetics of Web3.

## Colors

### Primary Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#a4ffb9` | Headings, highlights, active states |
| `primary-container` | `#00fd87` | Primary buttons, rank #1 badges |
| `primary-dim` | `#00ed7e` | Hover states, pulse animations |
| `on-primary` | `#006532` | Text on primary buttons |

### Surfaces (dark → light)
| Token | Hex | Usage |
|-------|-----|-------|
| `surface` / `background` | `#0a0e14` | Page background ("stadium floor") |
| `surface-container-low` | `#0f141a` | Section backgrounds ("the pitch") |
| `surface-container` | `#151a21` | Card insets |
| `surface-container-high` | `#1b2028` | Elevated cards |
| `surface-container-highest` | `#20262f` | Active game components ("HUD") |
| `surface-bright` | `#262c36` | Highlighted indicator areas |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#f1f3fc` | Primary text (white) |
| `on-surface-variant` | `#a8abb3` | Secondary text, labels |
| `on-background` | `#f1f3fc` | Body text on background |

### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `tertiary` | `#ff7350` | Alerts, live badges |
| `tertiary-container` | `#fc3c00` | Warning badges, power meter |
| `error` | `#ff716c` | Errors |
| `secondary` | `#e2e0fc` | Subtle accents |
| `outline-variant` | `#44484f` | Ghost borders (use at 10-20% opacity) |

## Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Headlines | **Space Grotesk** | 700-900 | Titles, scores, CTAs, uppercase |
| Body | **Lexend** | 400-600 | Body text, labels, descriptions |

### Scale
- `display-lg`: 3.5rem — Scores, winning announcements
- `text-5xl`: Hero headlines
- `text-2xl`: Section titles
- `text-xl`: Scores in cards, button text
- `text-base`: Body text
- `text-xs` / `text-[10px]`: Labels, metadata (uppercase + tracking-widest)

## Effects

### Glassmorphism ("Glass & Light" Rule)
```css
.glass-card {
  background: rgba(32, 38, 47, 0.6);  /* surface-variant at 60% */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### Kinetic Gradient (Primary Buttons)
```css
.kinetic-gradient {
  background: linear-gradient(135deg, #a4ffb9 0%, #00fd87 100%);
}
```

### Glow Effects
```css
/* Primary button hover */
box-shadow: 0 0 20px rgba(0, 253, 135, 0.4);

/* Button resting shadow */
box-shadow: 0 10px 40px rgba(0, 253, 135, 0.2);

/* Stadium overlay (page background) */
background: radial-gradient(circle at 50% -20%, rgba(0, 253, 135, 0.15) 0%, transparent 70%);
```

### Ambient Shadows (not material-style)
```css
/* Floating elements */
box-shadow: 0 20px 40px rgba(0, 253, 135, 0.08);
```

## Spacing & Radius
- Cards: `rounded-2xl` (1rem)
- Buttons: `rounded-xl` (0.75rem)
- Badges/Pills: `rounded-full`
- Section gaps: `mb-12` (3rem)
- Card padding: `p-5` to `p-6`

## Component Patterns

### Primary Button ("The Strike")
```
kinetic-gradient text-on-primary py-5 rounded-xl
font-headline font-black text-xl uppercase tracking-widest
shadow-[0_10px_40px_rgba(0,253,135,0.2)]
active:scale-95 transition-transform hover:glow-primary
```

### Secondary Button ("The Assist")
```
glass-card border border-outline-variant/15 text-primary py-5 rounded-xl
font-headline font-bold text-xl uppercase tracking-widest
active:scale-95 transition-transform
```

### Cards
- Background: `bg-[#0D1117]` or `glass-card`
- Border: `border border-outline-variant/20` (ghost border, never solid)
- Hover: `hover:border-primary/40`
- Inner structure defined by spacing, not divider lines

### Leaderboard Row
```
bg-[#0D1117] border border-outline-variant/20 rounded-xl p-4
flex items-center justify-between group hover:border-primary/40
```
- Left: avatar (w-12, rounded-full) + rank badge (absolute, -top-2 -left-2)
- Center: name (font-headline font-bold) + metadata (text-[10px] uppercase tracking-widest)
- Right: score (font-headline font-black text-xl)

### Badges
```
bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full
text-[10px] font-black uppercase tracking-widest
```

### NavBar
```
fixed bottom-0 w-full bg-[#0f141a]/80 backdrop-blur-xl
border-t border-[#44484f]/15 rounded-t-3xl
```

## Rules
1. **No 1px solid borders** — Use ghost borders at 10-20% opacity
2. **No pure black** — Always use surface tokens
3. **No text shadows** — Increase glass overlay opacity instead
4. **Color is light** — Treat neon green as emitted light, not pigment
5. **Asymmetric layouts** — Break the grid with overlapping elements for depth

# Alter Ego Design System

One token-driven visual language for **both** frontends:

| App | Root | Base stylesheet | Tailwind config |
|---|---|---|---|
| Alter Ego (main) | `frontend/` | `src/index.css` | `tailwind.config.js` |
| AI Better Me (POC) | `POCs/AI_BETTER_ME/frontend/` | `src/globals.css` | `tailwind.config.js` |

The two apps are **separate Vite builds** — they cannot share an import. Tokens are
duplicated by hand; **this file is the source of truth**. Change a value here first,
then mirror it into both base stylesheets (and both `index.css` mirror copies).

---

## 1. Semantic tokens

Defined as **HSL triplets without the `hsl()` wrapper** (`--primary: 176 61% 26%`) so
Tailwind can compose alpha: `bg-primary/90`, `ring-ring/40`. Consumed in Tailwind as
`bg-<token>` / `text-<token>-foreground` / `border-<token>`.

### Surfaces
| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `180 25% 99%` | `222 47% 7%` | app canvas |
| `foreground` | `222 47% 11%` | `210 40% 96%` | default text |
| `card` | `0 0% 100%` | `222 44% 11%` | cards, sheets, popovers' parent surface |
| `card-foreground` | `222 47% 11%` | `210 40% 96%` | text on `card` |
| `surface` | `190 40% 96%` | `217 33% 17%` | raised/inset panels, subtle wash blocks |
| `surface-foreground` | `222 47% 15%` | `210 40% 96%` | text on `surface` |
| `popover` | `0 0% 100%` | `222 44% 11%` | menus, tooltips, dropdowns |
| `popover-foreground` | `222 47% 11%` | `210 40% 96%` | text on `popover` |

### Brand
| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | `176 61% 26%` (teal‑700) | `172 66% 50%` (teal‑400) | primary buttons, active nav, links, focus |
| `primary-foreground` | `166 76% 97%` | `222 47% 11%` | text/icon on `primary` |
| `brand` | `38 92% 50%` (amber‑500) | `38 92% 55%` | **intentional** accent pop — badges, highlights, streak/celebration |
| `brand-foreground` | `26 83% 14%` | `26 83% 10%` | text on `brand` |

`brand` (amber) is **never body text on a light background** (fails contrast). Use it as
a fill with `brand-foreground` text, or a thin rule/dot. For the signature
teal→cyan→amber sweep use the `.bg-brand-gradient` utility (defined in `index.css`).

### Neutral roles
| Token | Light | Dark | Use |
|---|---|---|---|
| `secondary` | `197 37% 94%` | `217 33% 18%` | secondary buttons, quiet chips |
| `secondary-foreground` | `222 40% 20%` | `210 40% 96%` | text on `secondary` |
| `muted` | `210 40% 96%` | `217 33% 17%` | muted backgrounds, skeletons, disabled fills |
| `muted-foreground` | `215 16% 42%` | `215 20% 65%` | secondary text, captions, icons (AA on `background`) |
| `accent` | `190 45% 92%` | `217 33% 22%` | **hover/active wash only** (menu item hover, ghost button hover) — a subtle neutral, *not* the brand |
| `accent-foreground` | `200 45% 18%` | `210 40% 96%` | text on `accent` |

### Status
| Token | Light | Dark | Use |
|---|---|---|---|
| `success` | `160 84% 30%` | `160 70% 42%` | confirmations, positive deltas |
| `success-foreground` | `152 76% 96%` | `152 76% 8%` | text on `success` |
| `warning` | `32 95% 44%` | `38 92% 55%` | caution, at‑risk |
| `warning-foreground` | `30 90% 96%` | `26 83% 10%` | text on `warning` |
| `destructive` | `0 72% 45%` | `0 63% 47%` | delete, errors, negative deltas |
| `destructive-foreground` | `0 0% 100%` | `0 0% 100%` | text on `destructive` |

### Lines & focus
| Token | Light | Dark | Use |
|---|---|---|---|
| `border` | `214 32% 89%` | `217 33% 22%` | hairlines, card edges, dividers |
| `input` | `214 32% 86%` | `217 33% 24%` | form control borders (slightly stronger than `border`) |
| `ring` | `176 61% 32%` | `172 66% 45%` | focus ring (teal) |

### Scale
- `--radius: 0.75rem` → Tailwind `rounded-lg` = 0.75rem, `rounded-md` = calc(−2px), `rounded-sm` = calc(−4px).

---

## 2. Typography

- **Sans:** `Inter` → Tailwind `font-sans` (also the default). Weights loaded: 300–800.
- **Mono:** `JetBrains Mono` → `font-mono`. For durations, counts, code, keyboard hints.
- Loaded via Google Fonts `@import` in each base stylesheet. `Dancing Script` was removed.
- _Future optimization:_ self-host with `@fontsource/inter` + `@fontsource/jetbrains-mono` to drop the render-blocking `@import` and the third-party request.

---

## 3. Rules

1. **Use tokens, not raw ramps.** `bg-card` not `bg-white`; `text-muted-foreground` not
   `text-slate-500`; `border-border` not `border-gray-200`; `bg-primary` not `bg-teal-700`.
   Raw `slate-*` / `gray-*` / `teal-*` / `pink-*` / `lavender-*` in component markup is a
   migration target.
2. **One neutral ramp.** Slate, via the tokens. Do not introduce `gray-*`.
3. **Dark mode = `dark:` variants on token classes.** No new global attribute-selector
   hacks. The existing `.dark [class~="bg-white"] { … }` block in `frontend/src/index.css`
   is a temporary safety net — remove it in Phase 5 as screens migrate.
4. **`accent` ≠ brand.** `accent` is a quiet hover wash used by shadcn primitives. The
   brand pop is `brand` (amber) and `primary` (teal). Never set `--accent` to a saturated
   colour or every menu hover lights up.
5. **Motion.** Global easing is colour-only (`background-color`, `border-color`, `color`).
   Components opt into `transform`/opacity transitions locally. A
   `prefers-reduced-motion` killswitch is in each base stylesheet — honour it; avoid
   motion that carries meaning with no static fallback.
6. **Focus is always visible.** `focus-visible:ring-2 focus-visible:ring-ring`. Don't
   remove outlines without a replacement.

---

## 4. Primitive inventory

Canonical set: `frontend/src/components/Calendar_updated/components/ui/` (shadcn-style,
already token-based) — `button`, `card`, `input`, `badge`, `dialog`, `tabs`, `switch`,
`slider`, `tooltip`, `separator`, `scroll-area`, `toggle`, `toggle-group`.

- `Button` variants: `default` (primary/teal), `secondary`, `outline`, `ghost`, `link`,
  `destructive`; sizes `sm` / `default` / `lg` / `icon`.
- `frontend/src/components/ui/index.tsx` (bespoke indigo `Button`/`Input`/`Table`) is
  **unused** — slated for deletion in Phase 5.
- Two `use-toast` hooks (`src/hooks/`, `Calendar_updated/components/hooks/`) both wrap
  `src/components/ui/toast.tsx` — consolidation target (Phase 1).
- POC primitive set: `POCs/AI_BETTER_ME/frontend/src/components/ui/` — already
  shadcn-shaped; only needs the token values synced (done in Phase 0).

---

## 5. Reuse helpers

| Helper | Path |
|---|---|
| `cn()` (clsx + tailwind-merge) | `frontend/src/lib/utils.ts`, `.../Calendar_updated/lib/utils.ts`, POC `@/lib/utils` |
| `formatMinutesAsHoursMinutes` | `frontend/src/utils/utils.ts` |
| `useTheme` | `frontend/src/context/ThemeContext.tsx` |

---

## 6. Rollout phases

- **Phase 0 — Foundation (this change):** tokens + Tailwind wiring + fonts + shared
  animations + motion/focus rules, in both apps. No screens redesigned. Broken token
  classes (`bg-card`, `border-input`, `bg-secondary`, …) now resolve.
- **Phase 1 — Shared primitives:** promote the canonical `ui/` set behind
  `@/components/ui/*`, add `Textarea` / `IconButton` / loading `Button`, consolidate toast,
  delete the unused bespoke primitives.
- **Phase 2 — Shell + nav IA:** `Sidebar`, `App` shell, `PageHeader`, placeholder-hub
  copy; retire raw `teal-*` / `gray-*`; brand `--primary` lands on real buttons here.
- **Phase 3 — One "Coach" identity:** unify the floating chat, the `/coach/*` launcher,
  and daily checkups under one name + avatar + accent + theme; kill the pink/lavender
  palette and the per-message success toast; fix invisible typing dots / `z-60`.
- **Phase 4 — POC screens:** token pass, honest empty states, per-agent hue reduced to a
  dot/ring.
- **Phase 5 — Cleanup:** delete dead files, remove the `.dark [class~="…"]` override
  block, drop the `.ml-64` −4px hack, grep-guard against bare `bg-white` / `gray-*`.

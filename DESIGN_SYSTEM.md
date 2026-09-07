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

**Import primitives from `@/components/ui`** (barrel at
`frontend/src/components/ui/index.ts`). New code must not reach into
`Calendar_updated/components/ui/*` directly. The `@/*` → `src/*` alias is wired in
both `tsconfig.app.json` and `vite.config.ts`.

The barrel re-exports:

| From | Primitives |
|---|---|
| `Calendar_updated/components/ui/` (token-based shadcn set) | `badge`, `button`, `card`, `dialog`, `input`, `scroll-area`, `separator`, `slider`, `switch`, `tabs`, `toggle`, `toggle-group`, `tooltip` |
| `components/ui/` (local) | `select`, `toast`, `textarea` ✨, `icon-button` ✨, `page-header` ✨, `Skeleton` |

✨ added in Phase 1–2.

- `PageHeader` (`@/components/ui`): `eyebrow` / `title` / `subtitle` / optional `icon`
  chip / right-aligned `actions` slot. Token-styled, bottom border. Use it for the
  top-of-page block on every routed screen.

- `Button` (`@/components/ui`): variants `default` (primary/teal), `secondary`,
  `outline`, `ghost`, `link`, `destructive`; sizes `sm` / `default` / `lg` / `icon`;
  `isLoading` prop → leading spinner + `disabled` + `aria-busy` (ignored with `asChild`).
- `IconButton`: square, icon-only; `aria-label` is **type-required** so these never
  ship nameless. Same variants; sizes `sm` / `default` / `lg`; `isLoading`.
- `Textarea`: token-based, matches `Input`.
- Physical consolidation of the `Calendar_updated/` set into `components/ui/` is a
  Phase 5 move (needs the ~7 direct importers migrated first).
- **Deferred — toast consolidation:** two functionally-identical `use-toast` hooks
  (`src/hooks/use-toast.ts` — canonical, re-exported by `ui/toast.tsx`; and
  `Calendar_updated/components/hooks/use-toast.ts` — used by 6 screens). They are
  currently *separate module instances* (separate toast stores). Untangling which
  store `<ToastViewport>` actually renders is its own task — do it in Phase 3
  (toast behaviour changes there anyway) or Phase 5.
- `frontend/src/components/ui/index.tsx` (bespoke indigo `Button`/`Input`/`Table`,
  zero importers) — **deleted** in Phase 1.
- POC primitive set: `POCs/AI_BETTER_ME/frontend/src/components/ui/` — already
  shadcn-shaped; token values synced in Phase 0. Screen pass in Phase 4.

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
- **Phase 1 — Shared primitives (done):** `@/components/ui` barrel + `@` alias in vite,
  `Textarea` / `IconButton` (aria-label required) / `Button` `isLoading`, deleted the
  unused bespoke indigo primitives. Toast consolidation + physical file move deferred
  (see §4).
- **Phase 2 — Shell + nav IA (done):** `Sidebar` (new **Coach** group, `↗` + aria on
  `/coach/*` handoffs, `Sparkles` icon, tokens), `App` shell (`bg-background`, mobile
  top-bar wording, mobile bottom-nav 6→5 with a **More** entry, `Dashboard`→`Calendar`
  label), `ThemeToggle` tokens, new `PageHeader`, `ConnectedPlaceholderPage` tokens +
  "this is a hub" reframing. The `.dark [class~="…"]` block stays until Phase 5 — other
  un-migrated screens still lean on it.
- **Phase 3 — One "Coach" identity:** unify the floating chat, the `/coach/*` launcher,
  and daily checkups under one name + avatar + accent + theme; kill the pink/lavender
  palette and the per-message success toast; fix invisible typing dots / `z-60`.
- **Phase 4 — POC screens:** token pass, honest empty states, per-agent hue reduced to a
  dot/ring.
- **Phase 5 — Cleanup:** delete dead files, remove the `.dark [class~="…"]` override
  block, drop the `.ml-64` −4px hack, grep-guard against bare `bg-white` / `gray-*`.

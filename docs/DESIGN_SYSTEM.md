# Altiora Design System

## 1. Design direction

**Calm editorial intelligence.** Altiora sits on a cool-tinted neutral canvas and spends colour like a scarce resource: a single restrained **iris** accent carries primary actions and focal points, roughly on a 60/30/10 split — neutral surfaces, quiet secondary structure, and only a sliver of accent. Type hierarchy is confident but unshowy (tight tracking, balanced headings, tabular figures for anything numeric), shadows are layered and low-opacity so depth reads as light rather than weight, and motion is short and ease-out — present but barely noticed. The product is reflection-first, not KPI-heavy: qualitative insight (`InsightCard`) is a first-class citizen alongside metrics (`StatCard`). This is Altiora's own identity, not a Linear/Vercel reskin.

**One rule above all: no hardcoded values.** Never write raw hex colours, px shadows, or bespoke easings. Reach for the semantic token — a Tailwind utility that maps to a CSS variable (`bg-card`, `text-muted-foreground`, `rounded-xl`, `shadow-md`, `ease-emphasized`) or the JS motion tokens (`EASE`, `DURATION`). Tokens carry the light/dark switch and the accent discipline for free; literals break both.

---

## 2. Foundations / tokens

Source of truth: `app/globals.css` (CSS variables + `@theme inline` mappings) and `lib/motion.ts` (JS motion tokens).

### Color

All colours are authored in **OKLCH** as cool-tinted neutrals (hues clustered ~283–286) with an **iris `--primary`**. Both **light** (`:root`) and **dark** (`.dark`) palettes are fully defined. Tokens are semantic, not literal — consume them through the Tailwind color utilities that `@theme inline` maps (`--color-*` → the raw `--*` variables).

| Token                                                                                                                                        | Light                                              | Dark                                               | Use                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `--background` / `--foreground`                                                                                                              | `oklch(0.994 0.002 286)` / `oklch(0.24 0.012 285)` | `oklch(0.175 0.008 285)` / `oklch(0.94 0.004 286)` | App canvas + default text                                        |
| `--card` / `--card-foreground`                                                                                                               | `oklch(0.999 0.001 286)` / …                       | `oklch(0.212 0.009 285)` / …                       | Card surface                                                     |
| `--popover` / `--popover-foreground`                                                                                                         | `oklch(1 0 0)` / …                                 | `oklch(0.225 0.01 285)` / …                        | Floating surfaces (menus, dialogs)                               |
| `--primary` / `--primary-foreground`                                                                                                         | `oklch(0.545 0.155 281)` / …                       | `oklch(0.7 0.13 285)` / …                          | **The iris accent** — primary actions, active marks, focal chips |
| `--secondary` / `--secondary-foreground`                                                                                                     | `oklch(0.965 0.005 286)` / …                       | `oklch(0.265 0.01 285)` / …                        | Quiet secondary surfaces/buttons                                 |
| `--muted` / `--muted-foreground`                                                                                                             | `oklch(0.968 0.004 286)` / `oklch(0.53 0.017 285)` | `oklch(0.265 0.01 285)` / `oklch(0.7 0.02 285)`    | Subdued fills + secondary text                                   |
| `--accent` / `--accent-foreground`                                                                                                           | `oklch(0.958 0.008 283)` / …                       | `oklch(0.285 0.015 283)` / …                       | Hover/selected neutral tint (not the iris)                       |
| `--destructive`                                                                                                                              | `oklch(0.585 0.207 27)`                            | `oklch(0.7 0.19 24)`                               | Errors, destructive intent                                       |
| `--success`                                                                                                                                  | `oklch(0.58 0.13 155)`                             | `oklch(0.72 0.13 158)`                             | Positive trends/tone                                             |
| `--warning`                                                                                                                                  | `oklch(0.72 0.15 75)`                              | `oklch(0.8 0.13 78)`                               | Attention tone                                                   |
| `--border` / `--input`                                                                                                                       | `oklch(0.918 0.005 286)`                           | `oklch(1 0 0 / 8%)` / `/ 12%`                      | Hairlines + field borders                                        |
| `--ring`                                                                                                                                     | `oklch(0.545 0.14 281)`                            | `oklch(0.7 0.11 285)`                              | Focus ring (iris-tinted)                                         |
| `--chart-1..5`                                                                                                                               | iris, cyan, amber, magenta, periwinkle             | brightened equivalents                             | Data-viz series                                                  |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary(-foreground)`, `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-ring` | dedicated sidebar scale                            | dedicated sidebar scale                            | Sidebar chrome, kept distinct from the main canvas               |

**Accent discipline:** `--primary` is the _only_ saturated brand colour and appears sparingly — the active nav marker, the brand mark, primary buttons, `InsightCard tone="primary"`, `::selection`. Semantic status colours (`--destructive` / `--success` / `--warning`) are used only for their meaning. Everything else is neutral. `--success` / `--warning` are not mapped to a `-foreground` pair, so pair them with tinted fills (e.g. `bg-[color:var(--success)]/12`) rather than as solid backgrounds behind text.

### Typography

- **Sans (default/body + headings):** Inter via `--font-sans` (mapped to `--font-sans` and `--font-heading`).
- **Mono:** JetBrains Mono via `--font-geist-mono` (`--font-mono`).
- **Headings** (`h1`–`h4`) get `font-heading`, `tracking-tight`, and `text-wrap: balance`.
- **Body** uses `text-wrap: pretty`, `optimizeLegibility`, antialiasing, and OpenType `font-feature-settings: "cv02","cv03","cv04","cv11"`.
- **Numeric data** uses `font-variant-numeric: tabular-nums` — applied automatically to `th`, `td`, and any element with the `[data-tabular]` attribute (see `StatCard`).

### Spacing

Standard Tailwind **4px scale** (`p-1` = 4px, `p-2` = 8px, …). Compose padding/gaps from the scale; do not use arbitrary px values.

### Radius

Anchored on `--radius: 0.75rem` with a derived scale (all `calc()` off `--radius`):

`--radius-sm` (×0.6) · `--radius-md` (×0.8) · `--radius-lg` (=`--radius`) · `--radius-xl` (×1.4) · `--radius-2xl` (×1.8) · `--radius-3xl` (×2.2) · `--radius-4xl` (×2.6). Cards and most surfaces settle on the `rounded-xl` feel.

### Shadows

Layered, low-opacity, cool-tinted scale — each shadow is one or two stacked layers using `hsl(var(--shadow-tint) / <alpha>)`. `--shadow-tint` is `258 30% 12%` in light and `0 0% 0%` in dark, so shadows stay cool and soft rather than harsh grey.

`--shadow-2xs` → `--shadow-xs` → `--shadow-sm` → `--shadow-md` → `--shadow-lg` → `--shadow-xl` → `--shadow-2xl` (alpha climbs ~0.04 → 0.18 as elevation rises).

### Motion

CSS easings in `globals.css` mirror the JS tokens in `lib/motion.ts`:

- **`EASE`** — `emphasized` `[0.16, 1, 0.3, 1]` (smooth settle; `--ease-emphasized`), `standard` `[0.4, 0, 0.2, 1]` (`--ease-standard`), `outQuart` `[0.25, 1, 0.5, 1]` (`--ease-out-quart`).
- **`DURATION`** — `fast` `0.15s`, `base` `0.24s`, `slow` `0.4s`. Keep it short.
- **Variants** — `fadeIn`, `fadeInUp`, `scaleIn`, and `staggerContainer(stagger, delayChildren)` are prebuilt for Framer Motion.
- **Reduced motion is respected.** `globals.css` disables smooth scroll under `prefers-reduced-motion: reduce`, and the motion components (`Reveal`/`Stagger`/`StaggerItem`) gate every animation behind `useReducedMotion()`, rendering a plain `<div>` when the user opts out.

---

## 3. Components

### Layout

Composed by `AppShell`, which wraps the app in `CommandMenuProvider`, renders a fixed desktop `Sidebar`, a sticky `Topbar`, and a scrollable `<main>`. Feature pages supply only their own content.

#### `AppShell`

Authenticated application shell (sidebar + topbar + command palette + content region).
Props: `{ user: AppUser; children: React.ReactNode }`. Sidebar is `hidden lg:flex` (desktop only); content region is offset by `lg:pl-64`.

#### `Sidebar`

Fixed desktop navigation column on the dedicated `--sidebar` palette.
Props: `{ user: AppUser; className?: string; onNavigate?: () => void }`. Stacks `Brand`, `SearchTrigger`, primary `NavList`, secondary `NavList`, and `UserMenu`. `onNavigate` lets the mobile sheet close on selection.

#### `Topbar`

Sticky top bar with `backdrop-blur`.
Props: `{ user: AppUser }`. Mobile shows `MobileNav` + `Brand`; desktop shows `Breadcrumbs`. Right cluster: `SearchButton` (mobile), `ThemeToggle`, compact `UserMenu` (mobile).

#### `MobileNav`

Off-canvas navigation for small screens, built on the `Sheet` primitive.
Props: `{ user: AppUser }`. Trigger is a ghost `icon-sm` button (`aria-label="Open navigation"`, `lg:hidden`); the sheet has an `sr-only` title/description for a11y and closes on navigation via `onNavigate`.

#### `Breadcrumbs`

Path-derived breadcrumb trail (desktop topbar).
No props — reads `usePathname()`, splits segments, and resolves labels from a `LABELS` map, then `ALL_NAV`, then a title-cased fallback (long id-like segments are truncated to `xxxxxxxx…`). Returns `null` at the root. Last segment renders as `BreadcrumbPage` (current), earlier segments as links.

#### `NavList`

Renders a list of `NavItem`s as nav links.
Props: `{ items: NavItem[]; onNavigate?: () => void; className?: string }`. Active state (via `isActive`, exact match for `/dashboard`, prefix match elsewhere) gets `sidebar-accent` fill, `font-medium`, an iris `--primary` left marker pill, and iris icon; sets `aria-current="page"`. Inactive items are muted with a subtle hover. `badge: "soon"` items render a "Soon" pill. Focus-visible ring via `--ring`.

#### `Brand` / `BrandMark`

The Altiora wordmark and logo (an upward chevron — _altiora_ = "higher things").

- `BrandMark`: `{ className?: string }` — iris `bg-primary` rounded tile with the chevron SVG.
- `Brand`: `{ className?: string; href?: string }` (defaults to the dashboard route) — `BrandMark` + "Altiora" wordmark as a focusable link.

#### `SearchTrigger` / `SearchButton`

Two affordances that open the command palette (`useCommandMenu().setOpen(true)`).

- `SearchTrigger`: `{ className?: string }` — full-width input-styled button for the sidebar, with a "Search…" label and a `⌘K` `<kbd>`.
- `SearchButton`: `{ className?: string }` — compact ghost icon button for the mobile topbar (`aria-label="Search"`).

#### `ThemeToggle`

Light/dark/system switcher (next-themes) as a dropdown.
No props. Ghost `icon-sm` trigger with cross-fading Sun/Moon icons; a `DropdownMenuRadioGroup` of Light / Dark / System. Uses `useMounted()` to avoid a hydration mismatch (radio `value` is `undefined` until mounted).

#### `UserMenu`

Account avatar + dropdown (profile, settings, sign out).
Props: `{ user: AppUser; variant?: "full" | "compact" }`. `full` (sidebar) shows avatar + name + email + chevron; `compact` (mobile topbar) shows avatar only. Menu shows identity, a role `Badge` (`ROLE_LABELS[user.role]`), profile/settings links, and a sign-out item (currently a toast — auth is a later phase). Avatar falls back to initials.

#### `CommandMenuProvider` + `useCommandMenu` (⌘K palette)

Global command palette provider and its hook.

- `CommandMenuProvider`: `{ children }` — owns `open` state, binds a global **⌘K / Ctrl+K** listener to toggle it, and renders the `CommandDialog`. Groups: **Navigate** (all nav items, "Soon" shown as a shortcut, routes via `router.push`) and **Theme** (Light/Dark/System). Selecting an item closes the palette then runs the action.
- `useCommandMenu()`: returns `{ open, setOpen }`; throws if used outside the provider.

### Content & data

#### `PageContainer`

Centers and constrains page content with responsive gutters. Every authenticated page wraps its content in this.
Props: `{ children; className?; size?: "default" | "narrow" | "wide" }`. Widths: `narrow` = `max-w-3xl`, `default` = `max-w-[80rem]`, `wide` = `max-w-[96rem]`. Padding scales up at `sm`/`lg`.

#### `PageHeader`

The page's lead — eyebrow, title, description, and right-aligned actions.
Props: `{ title: string; description?: string; eyebrow?: string; actions?: ReactNode; className? }`. Title is an `h1` (`text-2xl`→`sm:text-3xl`, balanced). Eyebrow is an uppercase tracked label. Actions sit right on `sm+`, stack below on mobile.

#### `SectionHeader`

Sub-section heading with optional leading icon and trailing action.
Props: `{ title: string; description?: string; icon?: LucideIcon; action?: ReactNode; className? }`. Title is an `h2` (`text-base font-medium`). Lighter than `PageHeader` — for grouping within a page.

#### `StatCard` (+ `StatTrend`)

Compact metric card for quantitative data.
Props: `{ label: string; value: ReactNode; hint?: string; icon?: LucideIcon; trend?: StatTrend; className? }`.
`StatTrend = { value: string; direction: "up" | "down" | "flat"; positiveIsUp?: boolean }`.
Value uses `tabular-nums` + `data-tabular`. Trend picks an arrow (up/down/flat) and colours it by _meaning_: green `--success` when positive, `--destructive` when negative, muted when flat. `positiveIsUp: false` inverts the good/bad reading (e.g. fewer blockers is good when the arrow points down). Built on `Card size="sm"`.

#### `InsightCard`

Editorial card for qualitative insight — reflections, mentor notes, growth summaries. The reflection-first counterpart to `StatCard`.
Props: `{ title: string; description?: string; icon?: LucideIcon; tone?: Tone; children?: ReactNode; footer?: ReactNode; className? }`.
`tone`: `"default"` (muted chip) · `"primary"` (iris) · `"positive"` (`--success`) · `"attention"` (`--warning`) — the tone only colours the icon chip, keeping the accent restrained. Body is `children`; `footer` is a muted meta line.

#### `ComingSoon` (+ `ComingSoonFeature`)

Full-card placeholder for features in development.
Props: `{ icon: LucideIcon; title: string; description: string; features?: ComingSoonFeature[]; className? }`.
`ComingSoonFeature = { icon: LucideIcon; label: string; description: string }`. Shows an iris icon tile, an "In development" secondary `Badge`, and an optional two-column feature grid.

### States

#### `EmptyState`

Empty-collection placeholder.
Props: `{ icon?: LucideIcon; title: string; description?: string; action?: ReactNode; className?; variant?: "bordered" | "plain" }`. `bordered` (default) wraps in a dashed rounded container; `plain` drops the container. Centered icon tile + title + description + optional action.

#### `ErrorState`

Load/failure placeholder.
Props: `{ title?: string; description?: string; action?: ReactNode; className? }`. Defaults: "Something went wrong" / "We couldn't load this section. Please try again." Uses `--destructive`-tinted container + `TriangleAlert`, and carries `role="alert"` for assistive tech.

#### Skeletons (`skeletons.tsx`)

Loading placeholders built on the `Skeleton` primitive; layouts mirror their loaded counterparts to prevent layout shift.

- `SkeletonText`: `{ lines?: number = 3; className? }` — last line shorter.
- `SkeletonStatCard`: `{ className? }` — matches `StatCard`'s resting layout.
- `SkeletonCard`: `{ className? }` — header (icon + two lines) + 3-line body.
- `SkeletonList`: `{ rows?: number = 5; className? }` — avatar + two lines + trailing pill per row.

### Motion

Client components in `components/shared/motion.tsx`; all respect `useReducedMotion()`.

#### `Reveal`

Single element that fades + rises in on mount (`fadeInUp`).
Props: `{ children; className?; delay?: number = 0 }`.

#### `Stagger`

Container that staggers its `StaggerItem` children in on mount.
Props: `{ children; className?; stagger?: number = 0.05; delayChildren?: number = 0.04 }`.

#### `StaggerItem`

A child of `Stagger`; animates with the `fadeInUp` variant on the container's timeline.
Props: `{ children; className? }`.

### Navigation

#### `LinkButton`

A navigation control that _looks_ like a Button but is a real `<a>` (`next/link`).
Props: `React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>` — i.e. all `Link` props plus `variant` and `size`.
**Why it exists:** the base `Button` renders a `<button>` (Base UI). For navigation you want true link semantics — no `role="button"`, real href behaviour. `LinkButton` applies `buttonVariants({ variant, size })` styling directly to a `Link`, so it reads as a button but behaves as a link.

### Primitives (`components/ui/`)

shadcn/ui primitives generated in the **`base-nova`** style (`components.json`), built on **Base UI** (`@base-ui/react`) rather than Radix. Two consequences to know:

- **Composition uses the `render` prop, not Radix `asChild`.** To render a trigger/item as another element, pass `render={<Link … />}` or `render={<Button … />}` (see `MobileNav`, `ThemeToggle`, `UserMenu`, `Breadcrumbs`).
- **`TooltipProvider` wraps the whole app** (in `app/layout.tsx`), so `Tooltip` works anywhere without a local provider.

Available primitives: `avatar`, `badge`, `breadcrumb`, `button` (+ `buttonVariants`; variants `default` / `outline` / `secondary` / `ghost` / `destructive` / `link`; sizes `default` / `xs` / `sm` / `lg` / `icon` / `icon-xs` / `icon-sm` / `icon-lg`), `card` (+ `size` `default` / `sm`, and `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter`), `command`, `dialog`, `drawer`, `dropdown-menu`, `input-group`, `input`, `label`, `popover`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner` (toasts), `switch`, `tabs`, `textarea`, `tooltip`.

---

## 4. Building a new page

Keep the structure predictable:

1. **Wrap** the content in `PageContainer` (choose `size` — `narrow` for focused/form pages, `default` for most, `wide` for dense dashboards). The page renders inside `AppShell`, so you never re-declare the shell.
2. **Lead** with `PageHeader` (`eyebrow` optional, `title` required, `actions` for page-level buttons — use `LinkButton` when an action navigates).
3. **Group** related content under `SectionHeader`s.
4. **Fill** sections with `StatCard` (metrics, with `trend`) and `InsightCard` (qualitative, tone-restrained) — Altiora is reflection-first, so lean on `InsightCard`.
5. **Handle states:** `EmptyState` for empty collections, the `Skeleton*` components while loading (they mirror the loaded layout to avoid shift), `ErrorState` on failure.
6. **Animate entrances** by wrapping sections in `Reveal`, or a `Stagger` with `StaggerItem` children for lists/grids. Reduced motion is handled for you.
7. **Navigate** with `LinkButton` (button-styled links) rather than a `Button` with an onClick router push.

Throughout: reach for **semantic tokens** (Tailwind utilities backed by CSS variables) — never hardcoded colours, shadows, or easings.

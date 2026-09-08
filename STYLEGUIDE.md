# Prov Toys — Style guide for tool builders

Live version: `/styleguide`. Tokens live in `src/app/globals.css`. Brand source: `Provident Guidelines Kit/`.

## Principles
- **Navy dominates, orange punctuates.** Orange (`text-brand` / `bg-brand`) is the dot — use it for one small accent per screen (active indicator, the trailing dot, a single hero CTA). Never for large fills or body text.
- **Warm neutrals carry the breathing room.** Page = paper, cards = white with a 1px stone border. No drop shadows.
- **Simple and to the point.** One primary action per view. Short copy. Agents skim.

## Tokens (Tailwind utilities)
| Purpose | Class | Light value |
| --- | --- | --- |
| Page background | `bg-background` | Paper #FAF8F4 |
| Card / panel | `bg-card border` | White, stone border |
| Text | `text-foreground` | Deep Navy #1A2942 |
| Secondary text | `text-muted-foreground` | #5B6472 |
| Fills | `bg-secondary` (cream) · `bg-muted` (mist) | |
| Primary button / solid | `bg-primary text-primary-foreground` | Navy / paper |
| Brand accent | `text-brand` `bg-brand` | Orange #F3793C |
| Status | `text-success` `text-warning` `text-info` `text-destructive` | |
| Hover border | `hover:border-navy-2/60` | |
| Focus ring | automatic via `ring` | Provident Navy |

Raw brand colours (`bg-navy`, `bg-orange`, `bg-paper`, `bg-cream`, `bg-mist`, `bg-stone`, `bg-charcoal`) exist for rendering brand artwork (e.g. a post preview). Don't use them for UI chrome — use the semantic tokens so dark mode works.

## Typography
- **Google Sans Flex is the only typeface.** No second face, no serif emphasis — both were removed from the brand rules.
- Weight logic (set globally, you rarely need a weight class):
  - **Light 300** — everything except headers: body, labels, spec values, table cells, CTA/button labels. This is the default on `body`.
  - **Regular 400** — headers only: `text-display`, `text-h1`, `text-h2`, `h1–h3`, names and figures that act as titles. Use `font-normal` when you need it on something else.
  - **Medium 500** — tracked caps only: `.kicker` and small labels in that role. Never on running text.
- Never use `font-semibold` / `font-bold`.
- Scale: `text-display` 40 · `text-h1` 28 · `text-h2` 20 · `text-base` 16 · `text-sm` 14 · `.kicker` 11 uppercase, 0.14em tracking.
- The signature dot: `<span className="text-brand">.</span>` after a headline, or the `.dot` utility.

## Logo
`<Logo />` renders the **provtoys.** wordmark (`tone="dark"` navy on light surfaces, `tone="light"` white on navy). Files in `public/provtoys-navy.svg` / `provtoys-white.svg`. The dot is always orange. Minimum height 16px.

## Layout
- Page: `space-y-12`; header = `.kicker` + `text-display`.
- Section: `.kicker` + `text-h2`, then a grid `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`.
- Card: `rounded-xl border bg-card p-5`.
- Forms: max width `max-w-xl`, `space-y-5`, `<Label>` above field, helper text `text-xs text-muted-foreground` below.
- Radius: `rounded-lg` controls · `rounded-xl` cards · `rounded-full` badges/avatars.

## Mascot
`<Mascot size={160} />` (confused robot, transparent) and `<MascotLoop />` (silent dancing loop in a rounded tile) from `src/components/mascot.tsx`. One per screen, only where a person would naturally react: empty states, "coming soon", 404, the login welcome. Never beside form fields, in tables, or as decoration on working screens. Source files live in `Mascot/`; optimised assets in `public/mascot/`.

## Components (`src/components/ui`)
Button (`default | secondary | outline | ghost | brand | destructive | link`, sizes `sm | default | lg | icon`), Badge (`default | secondary | outline | brand | info | success | warning | destructive`), Input, Textarea, Select (native), Label, Table, Card. `StatusBadge` for request statuses. `Logo` (`tone="dark|light"`). `ToolIcon` (lucide by name).

Need something else? `npx shadcn@latest add <component>` — then swap its colour classes for the tokens above.

## Inside a tool page
Your component renders under the tool title (already on the page). Start your content at the section level: don't repeat the tool name, don't add your own page header. Put the form on the left / preview on the right for post generators: `grid gap-8 lg:grid-cols-[minmax(0,28rem)_1fr]`.

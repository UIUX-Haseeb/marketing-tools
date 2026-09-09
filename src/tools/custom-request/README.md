# custom-request — request to Marketing

Entry: `index.tsx`. A form (name, team, kind, title, details, needed-by) that calls `addRequest()` from `@/lib/store` and navigates to `/requests`.

Depends on: `@/lib/store` (`addRequest` — replace with your API), `@/lib/teams` (labels), `@/components/ui/{button,input,textarea,label,select}`, `next/navigation` (`useRouter`).

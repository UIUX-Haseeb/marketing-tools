# design-request — Graphic Design Request

The portal's **Marketing Design Request** form, built from the handover (Nov 2026): agents and admin staff (HR, procurement, IT, finance, operations) ask Marketing & Design for a design. It is styled on the portal's Support Tickets page — a board with a column per status, and a "New request" dialog in the ticket dialog's look (option cards, ⌘↵ to send, Esc to cancel, "Drag files here, or click to choose").

Route: `/tools/design-request`. Front-end only: requests, flags and the emails that would be sent are kept in this browser's localStorage (`store.ts`, key `provtoys-design-requests:v1`); **Reset** restores the demo requests.

## What's here

- **Board** (`board.tsx`) — Submitted, Returned, Confirmed, In progress, Delivered, Revision requested, Closed. *Signed in as* picks the demo person (the CRM login); *Viewing as* switches between **Requester** (own requests) and **Marketing** (every request + the admin actions). Search by ref, title, person or type.
- **New request** (`request-form.tsx`) — six steps: Request, Format, Content, Approvals, Timing, Terms. Errors show once you try to leave a step; *Send it* checks every step and jumps to the first problem. *Fill with a sample* loads a Just Listed request for testing.
- **Terms** (`terms.tsx`) — Appendix A verbatim, shown in the last step with the three confirmations. `[bracketed]` items are still placeholders.
- **Request pop-out** — the full request, its files, the history with every email it sent, and the actions for the current role and status.

## Form fields (handover section 2)

| Step | Fields | Rules |
| --- | --- | --- |
| Request | Name + email (from the login), department (editable), category (cards), request type (Appendix B, `catalog.ts`), title, brief | Brief ≥ 60 characters, placeholders rejected |
| Format | Formats (Feed post, Story, A4, Poster, Roll-up, Screen, Custom), custom size, where it's used, print quantity + bleed, language, editable source files | Custom size when *Custom*; quantity when *Print* |
| Content | Final copy (text or attachment), assets (upload or Drive link), reference (optional) | Placeholders rejected in the copy; pictures under 1500 px on the long side get a *Low resolution* warning |
| Approvals | Permit number + QR, developer approval, HR / department head approval, "people shown have agreed" | Permit when Agents › Listings and deals; developer approval when the type needs it or co-brand material is ticked; HR approval for announcements about a person (HR people types tick it for you) |
| Timing | Deadline, urgent + reason | Dates before the type's lead time are blocked (working days, Sat/Sun off); urgent goes to the Marketing Director |
| Terms | Read the terms · copy proofread · approvals attached | All three required |

Placeholders (`rules.ts › findPlaceholder`): TBC / TBA / TBD, N/A, "will send … later", "to follow", "coming soon", lorem ipsum, xxx, an answer of only dashes or dots.

Lead times (`catalog.ts › LEAD_DAYS`, drafts): social post 2 working days, flyer 3, large-format or print 5, brochure or multi-page 10. Each request type is tagged with one.

## Workflow (sections 3 and 4)

- **Submitted** → Marketing *Confirm*s it (scheduled) or *Return*s it with a note (optionally flagging a placeholder or incomplete submission). Urgent requests can't be confirmed until the Marketing Director approves or declines the urgency.
- **Returned** → the requester edits the same request and resubmits. Reply due in 2 working days: a reminder goes out in the last day, then it **auto-closes and adds a flag** (checked on page load; *Skip 2 working days (demo)* forces it).
- **Confirmed** → locked: no edits; changes need a new request. Marketing *Start*s design work → **In progress** → *Deliver* (upload the files) → **Delivered**.
- **Delivered** → the requester sends one consolidated revision list within 2 working days (2 rounds included) → **Revision requested** → *Deliver* again; or *Accept and close* → **Closed**.
- **Cancel** before design work starts: no flag. After it started: a flag.
- **3 flags** → *New request* is disabled for that person; Marketing sees them under *Paused at 3 flags* with **Reinstate**.
- Every change records the email it would send (requester, `design-requests@`, and the Marketing Director for urgent ones) in the request's history.

## Files

| File | What it does |
| --- | --- |
| `index.tsx` | Tool entry |
| `types.ts` | `DesignRequest`, `RequestDraft`, statuses, attachments, flags — the data model |
| `catalog.ts` | Categories and request types (Appendix B), lead times, formats, usages, languages |
| `rules.ts` | Working days, lead-time check, placeholder check, which approvals are needed, validation per step |
| `store.ts` | localStorage store, the workflow actions, flags, timers, the demo people |
| `seed.ts` | Demo requests (one per status), blank and sample drafts |
| `terms.tsx` | Terms & Conditions, verbatim |
| `request-form.tsx` | New / resubmit dialog |
| `board.tsx` | Board, pop-out, role switch, flag banners |
| `ui.tsx` | Choice cards, chips, drop zone, pills, modal, drawer |

## Moving it into the CRM

- Attachments only keep name, size and pixel size here — the CRM uploads them (portal storage or Drive; open question for the CTO).
- `store.ts` actions map one-to-one onto API calls; `runTimers` is the server's auto-close / reminder job; `history[].emailed` is the mailer.
- The flag counter may be the Listing Photoshoot Request's — `flagsOf` / `isPaused` / `reinstate` are the only places that read or write it.
- Roles: "Viewing as" stands in for the CRM's roles (Marketing Admin, designers, Marketing Director).

# design-request — Graphic Design Request

The portal's **Marketing Design Request** form, built from the handover (Nov 2026): agents and admin staff (HR, procurement, IT, finance, operations) ask Marketing & Design for a design. The board works like the portal's **Photoshoot Requests** page (Marketing › Photoshoot Requests): toolbar, "How it works", the team with what they're booked on, a coloured column per status, drag a card to the next column to take the next step, and a wide pop-out with the step bar, the request, the history and "··· More" / Close / the next step. The "New request" dialog is in the Support Tickets dialog's look (option cards, ⌘↵ to send, Esc to cancel, "Drag files here, or click to choose").

Route: `/tools/design-request`. Front-end only: requests, flags and the emails that would be sent are kept in this browser's localStorage (`store.ts`, key `provtoys-design-requests:v1`); **Reset** restores the demo requests.

## What's here

- **Three views** (the *Demo · Viewing as* bar): **Requester** (pick the person — own requests, New request, edit a returned one, revisions, accept), **Designer** (pick the designer — only the work assigned to them, from Confirmed on: start it, deliver it), **Manager** (every request, assign, return, approve urgent, Settings). Like the portal, once a designer is assigned only that designer sees the request.
- **Settings** (`settings.ts`, `settings-panel.tsx`, managers only) — the portal's Photography settings, for design: **Availability** (lead time per type class, book up to N days ahead, most requests due per day, the working week with hours, days to reply, revision rounds, flags before pausing), **Designers** (colour, working days, days off; add / remove), **Files** (smallest picture, warn or refuse, shortest brief), **Documents** (extra upload boxes in the form's Approvals step — required / asked for, reorder), **Terms & Conditions** (version, title, the wording as light markdown with a preview, the tick-box text; each request records the version accepted). Each tab saves on its own; the form, the rules, the board and the calendar read the saved values straight away. **Reset demo** puts the settings and forms back too.
- **Form builder** (`form-builder.tsx`, `forms.ts`, `custom-fields.tsx`, managers only) — create, edit, duplicate and delete custom forms. A form has a name, a one-line description, the request types it's **used for** (each type uses one form at most; picking a type that's on another form moves it on save) and its questions: short answer, paragraph, number, date, dropdown, multiple choice, tick-box, link, file upload and section headings — each with help text and *Required*, reordered with the arrows. A live preview shows it as the requester will. When a requester picks one of those types, the request form gains a **Details** step with the questions (required ones are checked like any other field). A sent request keeps a copy of the form and its answers (shown in the pop-out), so editing or deleting a form never changes requests already sent. Demo forms: Paid ad brief, Open house details, New joiner.
- **Board** (`board.tsx`, `columns.ts`) — columns Submitted, Returned, Confirmed, In progress, Delivered, Revision requested, Completed, Cancelled (Closed is split in two, like the portal). Toolbar: search, order (default = urgent first, then deadline), **Calendar**, **Refresh** (re-checks the reply timers), **Columns** (show / hide), **Settings**. *Booked* shows each designer's open work.
- **Drag and drop** — dragging a card lights up the columns it can go to (`columns.ts › moveTo`); dropping runs the same step as the pop-out's button, opening its dialog when it needs something (designer, note, files).
- **Request pop-out** (`detail.tsx`) — step bar, the request and its files on the left, the history with every email on the right; footer: *··· More* (Return with a note, Decline urgent, Change designer, Show on calendar, Cancel…), Close, and the next step (Assign designer, Start design work, Deliver, Mark as completed / Edit and resubmit, Accept and close).
- **Calendar** (`calendar.tsx`) — the month with each request on its deadline in its designer's colour, and the deadlines per designer.
- **New request** (`request-form.tsx`) — six steps: Request, Format, Content, Approvals, Timing, Terms. Errors show once you try to leave a step; *Send it* checks every step and jumps to the first problem. *Fill with a sample* loads a listing ad request for testing.
- **Terms** (`terms.tsx`) — Appendix A verbatim, shown in the last step with the three confirmations. `[bracketed]` items are still placeholders.

## Form fields (handover section 2)

| Step | Fields | Rules |
| --- | --- | --- |
| Request | Name + email (from the login), department (editable), category (cards), request type (Appendix B, `catalog.ts`; Agents trimmed to six types in Nov 2026), title, brief | Brief ≥ 60 characters, placeholders rejected |
| Format | Formats (Feed post, Story, A4, Poster, Roll-up, Screen, Custom), custom size, where it's used, print quantity + bleed, language, editable source files | Custom size when *Custom*; quantity when *Print* |
| Content | Final copy (text or attachment), assets (upload or Drive link), reference (optional) | Placeholders rejected in the copy; pictures under 1500 px on the long side get a *Low resolution* warning |
| Approvals | Permit number + QR, developer approval, HR / department head approval, "people shown have agreed" | Permit when Agents › Listings and deals; developer approval when the type needs it or co-brand material is ticked; HR approval for announcements about a person (HR people types tick it for you) |
| Timing | Deadline, urgent + reason | Dates before the type's lead time are blocked (working days, Sat/Sun off); urgent goes to the Marketing Director |
| Terms | Read the terms · copy proofread · approvals attached | All three required |

Placeholders (`rules.ts › findPlaceholder`): TBC / TBA / TBD, N/A, "will send … later", "to follow", "coming soon", lorem ipsum, xxx, an answer of only dashes or dots.

Lead times (Settings › Availability; defaults are the handover's drafts): social post 2 working days, flyer 3, large-format or print 5, brochure or multi-page 10. Each request type is tagged with one.

## Workflow (sections 3 and 4)

- **Submitted** → Marketing confirms it by **assigning a designer** (scheduled) or *Return*s it with a note (optionally flagging a placeholder or incomplete submission). Urgent requests can't be confirmed until the Marketing Director approves or declines the urgency.
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
| `rules.ts` | Working days, lead-time check, placeholder check, which approvals are needed, validation per step (all from Settings) |
| `settings.ts` | Design settings store and defaults (the handover's drafts) |
| `settings-panel.tsx` | The Settings sheet and its five tabs |
| `forms.ts` | Custom forms store, question types, the demo forms |
| `form-builder.tsx` | The manager's form builder |
| `custom-fields.tsx` | A form's questions as the requester sees them, and the answers in the pop-out |
| `store.ts` | localStorage store, the workflow actions, flags, timers, the demo people |
| `seed.ts` | Demo requests (every column, dates relative to today), blank and sample drafts |
| `terms.tsx` | Terms & Conditions — Appendix A verbatim as the default wording, and the renderer |
| `request-form.tsx` | New / resubmit dialog |
| `columns.ts` | The columns, their colours, which drag moves are allowed, "How it works" |
| `board.tsx` | Toolbar, How it works, Booked, columns, cards, drag and drop, Columns / Settings dialogs, flag banners |
| `detail.tsx` | Request pop-out and the step dialogs (assign, return, deliver, revision, cancel) |
| `calendar.tsx` | Designers calendar |
| `ui.tsx` | Choice cards, chips, drop zone, pills, modal, sheet, menu |

## Moving it into the CRM

- Attachments only keep name, size and pixel size here — the CRM uploads them (portal storage or Drive; open question for the CTO).
- `store.ts` actions map one-to-one onto API calls; `runTimers` is the server's auto-close / reminder job; `history[].emailed` is the mailer.
- The flag counter may be the Listing Photoshoot Request's — `flagsOf` / `isPaused` / `reinstate` are the only places that read or write it.
- Roles: "Viewing as" stands in for the CRM's roles (Marketing Admin, designers, Marketing Director).
- Custom forms map onto a forms table (form + questions + request types) and an answers JSON on the request; keep the snapshot so old requests stay readable.
- Designers (Settings › Designers) are demo names — in the CRM, the Marketing & Design team. Settings are per browser here; in the CRM they're shared.

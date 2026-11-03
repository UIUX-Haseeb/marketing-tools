/**
 * Design Request: Terms & Conditions — handover Appendix A, verbatim. Items in [brackets]
 * are placeholders still to confirm; they stay in brackets until they are.
 */
import type { ReactNode } from "react";

type Clause = [string, ReactNode];

const RULES: [string, string][] = [
  [
    "The 2-working-day rule",
    "If we ask you for missing copy, assets or approvals and don’t hear back within 2 working days, the request is closed and the designer moves on to the next job. You can resubmit it as a new request.",
  ],
  [
    "3 flags and requests pause",
    "Each incomplete or placeholder submission, late cancellation or closed request adds a flag to your portal profile. At 3 flags, the portal stops accepting your requests until the Marketing Director and [Head of Department] review and reinstate your account.",
  ],
  [
    "Lead times, no queue-jumping",
    "Please book at least the lead time shown for your design type (for example social post [2] working days, flyer [3], large-format or print [5], brochure or multi-page [10]). Requests are handled first-come, first-served, so we can’t move urgent requests ahead of others.",
  ],
];

const SECTIONS: [string, Clause[]][] = [
  [
    "1. Get the brief right",
    [
      ["1.1", "Choose the design type and every format and size you need: feed post, story, A4, poster size, screen dimensions. We only deliver what is selected in the request."],
      ["1.2", "State where it will be used (Instagram, WhatsApp, print, event screen, email). Print jobs need the final size and bleed requirements."],
      ["1.3", "One request covers one design. If you need a set (for example three unit types, or a post and a story), list each one clearly in the same request or submit separate requests."],
      ["1.4", "Use real information in every field. Placeholders such as “TBC”, “N/A” or “will send later” for copy, dates or venue will be flagged."],
      ["1.5", "If something is missing or wrong, Admin will send the request back with a note on what to fix. Update the same request and resubmit it. Your design is only scheduled once the portal shows Confirmed."],
    ],
  ],
  [
    "2. Content and assets are your responsibility",
    [
      ["2.1", "Send final, approved copy in English and Arabic where needed. We design the layout and don’t write or rewrite content."],
      ["2.2", "You are responsible for the accuracy of every name, price, figure, date and spelling. We check layout and brand, not facts. Please proofread before you submit."],
      ["2.3", "Send high-resolution photos, renders, floor plans and logos with the request. Photos taken from WhatsApp or social media are usually too low quality for print or large screens. For example: “Renders in the shared Drive folder [link], floor plans in the same folder, agent portrait attached.”"],
      ["2.4", "Only send images, fonts and music you have the right to use. We can’t use material from competitors, stock sites without a licence, or other companies’ designs."],
      ["2.5", "Let anyone shown or named in the design know in advance, and make sure they’ve agreed. This includes owners, tenants, clients and staff."],
    ],
  ],
  [
    "3. Permits, approvals and legal information",
    [
      ["3.1", "Any advertisement for a property or project needs a valid permit before it is published. Send the permit number and QR code with the request. We can’t finalise the design without them."],
      ["3.2", "Developer, partner or co-brand material (logos, renders, project names) needs the developer’s written approval, which you arrange before you submit."],
      ["3.3", "Announcements about people (promotions, anniversaries, new joiners, condolences) need approval from HR or the relevant department head. Attach it to the request."],
      ["3.4", "Final sign-off before publishing sits with you and your approver. We don’t post or send designs on your behalf."],
    ],
  ],
  [
    "4. Brand guidelines",
    [
      ["4.1", "Every design follows the Provident Brand Identity Guidelines: logo placement, colours, typography, spacing and layout. We can’t change these on request."],
      ["4.2", "You can share references as inspiration for layout or mood. We’ll adapt the idea to our brand and won’t copy another company’s design."],
      ["4.3", "If a request conflicts with the guidelines, the designer will tell you why and suggest an on-brand alternative."],
    ],
  ],
  [
    "5. No changes after confirmation",
    [
      ["5.1", "Once the request is Confirmed, it can’t be changed by phone, WhatsApp, DM or in person. This includes adding sizes, swapping copy, changing the concept or adding extra designs."],
      ["5.2", "Additional designs, new sizes or a change of concept need a new request."],
    ],
  ],
  [
    "6. Cancelling or rescheduling",
    [
      ["6.1", "Cancel or move your request in the portal before design work starts and there is no flag."],
      ["6.2", "Cancelling after work has started, or leaving a request unanswered for more than 2 working days after we have asked for something, counts as a flag."],
      ["6.3", "If the designer is unavailable, we’ll reassign your request or confirm a new date. You’ll be told in advance."],
    ],
  ],
  [
    "7. What you can expect from us",
    [
      ["7.1", "Your design will be on brand, and we’ll tell you before work starts if something in the brief won’t work."],
      ["7.2", "We’ll deliver by the date shown in the portal and upload the files to your request. If we’re going to miss it, we’ll tell you before the due date and give you a new one."],
      ["7.3", "We’ll deliver in the formats you selected. Editable source files are provided only if you ticked that option."],
      ["7.4", "We keep your project details confidential, including unreleased projects, pricing and campaign plans. We don’t share your requests with other teams."],
    ],
  ],
  [
    "8. Asking for edits",
    [
      ["8.1", "Send changes through the portal as one complete list within 2 working days of delivery. [2] revision rounds are included."],
      ["8.2", "We’ll fix: layout or alignment issues, brand errors, wrong crops, a booked format that was missed, text we mistyped, and wrong colours."],
      ["8.3", "Not covered: changes to copy after approval, a new concept, extra sizes you didn’t book, or redoing work because the original brief was incomplete or wrong."],
    ],
  ],
];

export function Terms() {
  return (
    <article className="space-y-5 text-sm leading-relaxed">
      <header className="space-y-1.5">
        <h3 className="text-h2">Design Request: Terms &amp; Conditions</h3>
        <p className="text-muted-foreground">Version 1.0 · November 2026. Please read before you submit.</p>
        <p className="kicker text-muted-foreground">Provident Real Estate · Marketing &amp; Design Team · For every design request made through the portal</p>
      </header>
      <p>
        We want every request to move quickly, for you and for our designers. Most delays come from three things: the brief is incomplete, the copy or assets arrive late, or the
        content changes after work has started. These terms explain what we need from you, what you can expect from us, and what happens when something goes wrong.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {RULES.map(([h, t]) => (
          <section key={h} className="rounded-xl border bg-secondary/50 p-4">
            <h4 className="mb-1.5 font-normal">{h}</h4>
            <p className="text-[13px] text-muted-foreground">{t}</p>
          </section>
        ))}
      </div>
      {SECTIONS.map(([h, clauses]) => (
        <section key={h} className="space-y-2">
          <h4 className="text-base font-normal">{h}</h4>
          {clauses.map(([n, t]) => (
            <p key={n} className="flex gap-3">
              <span className="w-7 shrink-0 font-medium tabular-nums">{n}</span>
              <span>{t}</span>
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

"use client";

// Custom request → Marketing. Demo: saved to the browser's local store (src/lib/store.ts).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addRequest } from "@/lib/store";
import { TEAMS, TEAM_LABELS } from "@/lib/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const KINDS = [
  { value: "custom", label: "Other / not sure" },
  { value: "video", label: "Video" },
  { value: "campaign-ad", label: "Campaign / ad creative" },
  { value: "social-post", label: "Social media post" },
  { value: "print", label: "Print material (brochure, flyer, signage)" },
  { value: "email", label: "Email / newsletter" },
  { value: "presentation", label: "Presentation" },
];

export default function CustomRequestTool() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    addRequest({
      type: String(fd.get("kind") || "custom"),
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      dueDate: String(fd.get("dueDate") || "") || null,
      requester: String(fd.get("requester") || "").trim() || "Someone",
      team: TEAM_LABELS[(fd.get("team") as keyof typeof TEAM_LABELS) || "OTHER"],
    });
    router.push("/requests?sent=1");
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requester">Your name</Label>
          <Input id="requester" name="requester" required placeholder="e.g. Fatima Al Zahra" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team">Team</Label>
          <Select id="team" name="team" defaultValue="AGENTS">
            {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABELS[t]}</option>)}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kind">What do you need?</Label>
        <Select id="kind" name="kind" defaultValue="custom">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} placeholder="e.g. Reel for Palm Jumeirah penthouse listing" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details</Label>
        <Textarea id="description" name="description" rows={6} placeholder="What is it for, who is the audience, links to references or property details, sizes/formats needed…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Needed by <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="dueDate" name="dueDate" type="date" className="w-48" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={busy}>Send to Marketing</Button>
        <p className="text-xs text-muted-foreground">You can track it under “My requests”.</p>
      </div>
    </form>
  );
}

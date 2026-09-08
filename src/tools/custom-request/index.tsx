// Custom request → Marketing. Server component; the form posts to a server action.
import { submitCustomRequest } from "@/lib/actions/requests";
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
  return (
    <form action={submitCustomRequest} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="kind">What do you need?</Label>
        <Select id="kind" name="kind" defaultValue="custom">
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} placeholder="e.g. Reel for Palm Jumeirah penthouse listing" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What is it for, who is the audience, any links to references or property details, sizes/formats needed…"
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Needed by <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="dueDate" name="dueDate" type="date" className="w-48" />
      </div>

      <input type="hidden" name="about" value="" />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">Send to Marketing</Button>
        <p className="text-xs text-muted-foreground">You can track it under “My requests”.</p>
      </div>
    </form>
  );
}

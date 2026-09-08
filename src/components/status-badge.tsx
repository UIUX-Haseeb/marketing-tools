import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@/generated/prisma/enums";

const MAP: Record<RequestStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  NEW: { label: "New", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  DONE: { label: "Done", variant: "success" },
  REJECTED: { label: "Declined", variant: "destructive" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

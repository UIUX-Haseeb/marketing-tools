import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Mascot size={200} />
      <h1 className="text-h1 font-normal">Page not found<span className="text-brand">.</span></h1>
      <p className="text-sm text-muted-foreground">It doesn’t exist, or your team doesn’t have access to it.</p>
      <Button asChild variant="outline"><Link href="/">Back to tools</Link></Button>
    </main>
  );
}

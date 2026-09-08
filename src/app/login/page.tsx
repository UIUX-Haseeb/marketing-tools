import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";

const ERRORS: Record<string, string> = {
  domain: "Please sign in with your @providentestate.com Google account.",
  notlisted: "Your account isn't set up yet. Ask the Marketing team to add you.",
  AccessDenied: "Access denied.",
  Configuration: "Sign-in isn't configured yet. Check the server environment variables.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">P</div>
          <h1 className="text-xl font-semibold">Marketing Tools</h1>
          <p className="text-sm text-muted-foreground">Sign in with your Provident Google account.</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl ?? "/" });
          }}
        >
          <Button type="submit" className="w-full" size="lg">
            Continue with Google
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{ERRORS[error] ?? "Something went wrong. Please try again."}</p>}
      </div>
    </main>
  );
}

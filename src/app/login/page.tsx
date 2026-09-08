import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/logo";
import { MascotLoop } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS: Record<string, string> = {
  domain: "Please sign in with your @providentestate.com account.",
  notlisted: "Your account isn't set up yet. Ask the Marketing team to add you.",
  CredentialsSignin: "Could not complete sign in. Please try again.",
  AccessDenied: "Access denied.",
  Configuration: "Sign-in isn't configured yet.",
};

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { error, callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — navy dominates */}
      <section className="relative hidden flex-col justify-between bg-navy p-12 text-paper lg:flex">
        <Logo tone="light" height={28} />
        <div className="max-w-md space-y-8">
          <MascotLoop className="w-56 ring-1 ring-white/10" />
          <div className="space-y-5">
          <p className="kicker text-sidebar-muted">Prov Toys</p>
          <h1 className="text-display font-medium">
            Marketing tools for the <span className="accent-word">whole</span> team<span className="text-brand">.</span>
          </h1>
          <p className="text-base leading-relaxed text-sidebar-muted">
            Create on-brand posts in minutes, or send Marketing exactly what you need.
          </p>
          </div>
        </div>
        <p className="text-sm text-sidebar-muted">Provident Real Estate · Internal use</p>
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3 lg:hidden">
            <Logo height={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-h1 font-medium">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use your Provident Google account.</p>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              {ERRORS[error] ?? "Something went wrong. Please try again."}
            </p>
          )}

          <form
            action={async () => {
              "use server";
              const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
              if (hasGoogle) {
                await signIn("google", { redirectTo });
              } else {
                // Dev fallback while Google OAuth keys aren't configured
                await signIn("credentials", { email: "marketing.uiux@providentestate.com", redirectTo });
              }
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              <GoogleMark /> Continue with Google
            </Button>
          </form>

          <div className="flex items-center gap-3 text-kicker uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-4"
            action={async (formData: FormData) => {
              "use server";
              const email = (formData.get("email") as string)?.trim().toLowerCase();
              if (!email) return;
              try {
                await signIn("credentials", { email, redirectTo });
              } catch (err) {
                if (err instanceof AuthError) redirect("/login?error=CredentialsSignin");
                throw err;
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" required placeholder="name@providentestate.com" className="h-10" />
            </div>
            <Button type="submit" variant="outline" size="lg" className="w-full">
              Continue with email
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground lg:hidden">Provident Real Estate · Internal use</p>
        </div>
      </section>
    </main>
  );
}

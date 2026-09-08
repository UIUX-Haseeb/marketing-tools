import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "next-auth";

const ERRORS: Record<string, string> = {
  domain: "Please sign in with your @providentestate.com account.",
  notlisted: "Account error. Please try again.",
  CredentialsSignin: "Could not complete sign in. Please try again.",
  AccessDenied: "Access denied.",
  Configuration: "Sign-in configuration error.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { error, callbackUrl } = await searchParams;


  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-sm">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Provident Marketing Tools</h1>
          <p className="text-sm text-muted-foreground">
            Internal marketing portal for requests and content generation.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {ERRORS[error] ?? "Authentication error. Please try again."}
          </div>
        )}

        <div className="space-y-4">
          {/* Google Sign In */}
          <form
            action={async () => {
              "use server";
              const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
              if (hasGoogle) {
                await signIn("google", { redirectTo: callbackUrl ?? "/" });
              } else {
                // Instant login as admin if Google Cloud keys are not configured
                await signIn("credentials", {
                  email: "marketing.uiux@providentestate.com",
                  redirectTo: callbackUrl ?? "/",
                });
              }
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-2.5 font-medium hover:bg-secondary"
              size="lg"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
            </div>
          </div>

          {/* Direct Email Form */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = (formData.get("email") as string)?.trim().toLowerCase();
              if (!email) return;

              try {
                await signIn("credentials", {
                  email,
                  redirectTo: callbackUrl || "/",
                });
              } catch (err) {
                if (err instanceof AuthError) {
                  redirect(`/login?error=CredentialsSignin`);
                }
                throw err;
              }
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Work Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@providentestate.com"
                className="h-10"
              />
            </div>

            <Button type="submit" className="w-full h-10 font-medium">
              Continue
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Provident Real Estate · Internal Use
        </p>
      </div>
    </main>
  );
}

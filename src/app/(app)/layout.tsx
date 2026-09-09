import Link from "next/link";
import { Logo } from "@/components/logo";

/** Single-purpose shell: a slim brand bar, then the tools. Navigation, requests and sign-out live in the CRM. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-sidebar px-6 py-3.5 text-sidebar-foreground md:px-10">
        <Link href="/" aria-label="Prov Toys home">
          <Logo tone="light" height={20} />
        </Link>
        <span className="text-xs text-sidebar-muted">Provident Real Estate · Internal</span>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}

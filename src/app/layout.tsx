import type { Metadata } from "next";
import { googleSansFlex, literata } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Prov Toys", template: "%s · Prov Toys" },
  description: "Provident Estate internal marketing and content tools.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${googleSansFlex.variable} ${literata.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { googleSansFlex } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Prov Toys", template: "%s · Prov Toys" },
  description: "Provident Estate internal marketing and content tools.",
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32.png", type: "image/png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={googleSansFlex.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

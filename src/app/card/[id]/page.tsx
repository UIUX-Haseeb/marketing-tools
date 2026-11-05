import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contactFromParams } from "@/tools/e-business-card/contact";
import { ContactPage } from "@/tools/e-business-card/contact-page";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The contact page an e-card's QR opens — public, outside the app shell. See src/tools/e-business-card/contact.ts. */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = contactFromParams((await params).id, await searchParams);
  return { title: { absolute: c ? `${c.name} · Provident Real Estate` : "Provident Real Estate" } };
}

export default async function CardPage({ params, searchParams }: Props) {
  const c = contactFromParams((await params).id, await searchParams);
  if (!c) notFound();
  return <ContactPage c={c} />;
}

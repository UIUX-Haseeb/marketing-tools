import { icons, type LucideProps } from "lucide-react";

/** Renders a lucide icon by name (used by the tool registry). */
export function ToolIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = icons[name as keyof typeof icons] ?? icons.Wrench;
  return <Icon {...props} />;
}

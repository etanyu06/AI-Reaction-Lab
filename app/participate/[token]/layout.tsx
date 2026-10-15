import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            AI Reaction Lab
          </Link>
          <p className="text-sm text-muted-foreground">Opt-in research session</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

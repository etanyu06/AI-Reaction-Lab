import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          AI Reaction Lab
        </Link>
        <nav className="flex items-center gap-4 text-sm" aria-label="Main navigation">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link href="/security" className="text-muted-foreground hover:text-foreground">
            Security
          </Link>
          <Button asChild size="sm">
            <Link href="/auth">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>AI Reaction Lab</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/security" className="hover:text-foreground">
            Security & privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

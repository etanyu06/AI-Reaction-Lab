import Link from "next/link";
import { BarChart3, FolderKanban, Settings, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/settings", label: "Workspace", icon: Settings }
];

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-secondary/30 p-4 lg:block">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        AI Reaction Lab
      </Link>
      <nav className="mt-8 space-y-1" aria-label="Dashboard">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

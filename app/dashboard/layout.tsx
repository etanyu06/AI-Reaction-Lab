import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { UserMenu } from "@/components/app-shell/user-menu";
import { WorkspaceSwitcher } from "@/components/app-shell/workspace-switcher";
import { mockWorkspace } from "@/lib/mock-data";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-8">
          <WorkspaceSwitcher name={mockWorkspace.name} />
          <UserMenu />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

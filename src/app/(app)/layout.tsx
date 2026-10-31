import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { FadeIn } from "@/components/motion";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "STAFF");
  return (
    <div className="flex min-h-svh">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <FadeIn>{children}</FadeIn>
        </main>
      </div>
    </div>
  );
}

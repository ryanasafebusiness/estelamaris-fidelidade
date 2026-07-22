import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";
export const metadata: Metadata = {
  title: "Estelamaris Admin",
  description: "Painel administrativo do programa de pontos Estelamaris.",
  manifest: "/admin.webmanifest",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, papel")
    .eq("id", user.id)
    .single();
  if (!profile || profile.papel !== "admin") redirect("/");

  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-surface text-ink">
      {/* Sidebar (desktop) */}
      <aside className="glass sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <div className="mb-8 flex flex-col gap-1 px-1">
          <img src="/logo-pontos.png" alt="Estelamaris" className="h-8 w-auto object-contain self-start" />
          <div className="text-[10.5px] font-semibold text-muted pl-1">Painel Admin</div>
        </div>

        <AdminNav variant="side" />

        <div className="mt-auto border-t border-line pt-4 flex flex-col gap-3">
          <div>
            <div className="truncate text-[13px] font-bold text-ink">
              {profile?.nome || user.email}
            </div>
            <Link
              href="/"
              className="mt-1 block text-[12px] font-semibold text-muted transition-colors hover:text-ink"
            >
              ← Voltar ao app
            </Link>
          </div>
          <div className="flex items-center gap-2 border-t border-line pt-2">
            <span className="text-[12px] font-semibold text-muted">Tema:</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="glass sticky top-0 z-20 border-b border-line px-4 py-3 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-pontos.png" alt="Estelamaris" className="h-6 w-auto object-contain" />
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-muted">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-[12px] font-bold text-blue">
              ← App
            </Link>
          </div>
        </div>
        <AdminNav variant="top" />
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-full flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}

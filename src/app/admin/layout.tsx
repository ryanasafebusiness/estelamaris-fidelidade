import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estelamaris Admin",
  description: "Painel administrativo do programa de pontos Estelamaris.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex min-h-dvh bg-[#0c1222]">
      {/* Sidebar */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/5 bg-[#0f172a] px-4 py-6">
        <div className="mb-8">
          <div className="text-[15px] font-extrabold tracking-tight text-white">
            estelamaris
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-white/40">
            Painel Admin
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <AdminNavLink href="/admin" label="Dashboard" icon={<DashIcon />} />
          <AdminNavLink href="/admin/notas" label="Notas" icon={<ReceiptIcon />} />
          <AdminNavLink href="/admin/catalogo" label="Catálogo" icon={<GiftIcon />} />
          <AdminNavLink href="/admin/resgates" label="Resgates" icon={<TicketIcon />} />
        </nav>

        <div className="mt-auto border-t border-white/5 pt-4">
          <div className="text-[13px] font-bold text-white/70 truncate">
            {profile.nome || user.email}
          </div>
          <Link
            href="/"
            className="mt-2 block text-[12px] font-semibold text-white/30 transition-colors hover:text-white/60"
          >
            ← Voltar ao app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-8 py-6">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}

/* ── Inline SVG icons for the sidebar ── */
function DashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8h8M7 12h6M6 20V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15l-2.3-1.5L13 20l-2.7-1.5L8 20 6 20Z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8V21M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7M12 8c-2-3-6-3-6 0M12 8c2-3 6-3 6 0" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 9v12h20V9M9 3v18" />
    </svg>
  );
}

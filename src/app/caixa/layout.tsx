import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CaixaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();
    
  if (!profile || (profile.papel !== "admin" && profile.papel !== "caixa")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-white/80 p-4 pb-0 backdrop-blur-md">
        <div className="mx-auto flex max-w-[460px] items-center justify-between pb-4">
          <div>
            <div className="text-[18px] font-extrabold tracking-tight text-ink">Caixa</div>
            <div className="text-[12px] font-semibold text-muted">Ferramentas de atendimento</div>
          </div>
          {profile.papel === "admin" && (
            <Link href="/admin" className="text-[12px] font-bold text-blue">
              ← Admin
            </Link>
          )}
        </div>
        
        {/* Navigation Tabs */}
        <div className="mx-auto flex max-w-[460px] gap-6">
          <Link
            href="/caixa/notas"
            className="border-b-2 border-transparent pb-3 text-[14px] font-bold text-muted transition-colors hover:text-ink focus:text-ink active:text-ink [&:active]:border-red [&:focus]:border-red"
          >
            Conferir Notas
          </Link>
          <Link
            href="/caixa/resgates"
            className="border-b-2 border-transparent pb-3 text-[14px] font-bold text-muted transition-colors hover:text-ink focus:text-ink active:text-ink [&:active]:border-red [&:focus]:border-red"
          >
            Validar Resgates
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-surface">
        {children}
      </main>
    </div>
  );
}

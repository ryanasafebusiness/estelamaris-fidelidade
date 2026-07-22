import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthAndProfile, logout } from "@/app/actions/auth";
import PerfilForm from "@/components/auth/PerfilForm";
import BottomNav from "@/components/BottomNav";
import { Close } from "@/components/icons";

export default async function PerfilPage() {
  const { user, profile } = await requireAuthAndProfile();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      <header className="flex items-center justify-between pt-4">
        <Link
          href="/"
          aria-label="Voltar"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <Close />
        </Link>
        <div className="text-center">
          <div className="text-[16px] font-extrabold tracking-tight">Meu perfil</div>
          <div className="mt-px text-[11px] font-semibold text-muted">
            Nível {profile?.nivel ? cap(profile.nivel) : "Bronze"}
          </div>
        </div>
        <span className="w-[38px]" />
      </header>

      <div className="glass mt-5 rounded-[26px] p-5 shadow-glass">
        <PerfilForm
          nome={profile?.nome ?? ""}
          telefone={profile?.telefone ?? ""}
          cpf={profile?.cpf ?? ""}
          email={user.email ?? ""}
        />
      </div>

      {profile?.papel === "admin" && (
        <Link
          href="/admin"
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-ink px-4 py-3.5 text-[14px] font-extrabold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Acessar Painel Admin
        </Link>
      )}

      <form action={logout} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3.5 text-[14px] font-extrabold text-red transition-transform hover:bg-white"
        >
          Sair da conta
        </button>
      </form>

      <BottomNav current="home" />
    </main>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

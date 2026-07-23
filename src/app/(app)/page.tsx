import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthAndProfile } from "@/app/actions/auth";
import BottomNav from "@/components/BottomNav";
import { User, Gear, StarSolid, ArrowUp, Plus, Camera, Swap, History, Dots, Receipt } from "@/components/icons";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import ScannerButton from "@/components/ScannerButton";

type Movimento = { id: number; tipo: string; pontos: number; descricao: string | null; created_at: string };

function fmtPts(n: number) {
  return n.toLocaleString("pt-BR");
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtData(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia) return `Hoje · ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${hora}`;
}

export default async function HomePage() {
  const { user, profile } = await requireAuthAndProfile();
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ data: atividadeData }, { data: mesData }] = await Promise.all([
    supabase
      .from("points_ledger")
      .select("id, tipo, pontos, descricao, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("points_ledger")
      .select("pontos")
      .eq("user_id", user.id)
      .eq("tipo", "credito")
      .gte("created_at", inicioMes.toISOString()),
  ]);

  const nivel = profile?.nivel ? capitalize(profile.nivel) : "Bronze";
  const saldo = profile?.pontos_saldo ?? 0;
  const esteMes = (mesData ?? []).reduce((s: number, r: { pontos: number }) => s + r.pontos, 0);
  const atividade = (atividadeData ?? []) as Movimento[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      {/* Top bar */}
      <header className="flex items-center justify-between pt-4">
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <User />
        </Link>

        <div className="text-center leading-tight">
          <div className="text-[16px] font-extrabold tracking-tight text-ink">
            Drogaria Estelamaris
          </div>
        </div>

        <ScannerButton />
      </header>

      {/* Pílulas: nível / este mês / enviar */}
      <section className="mt-3.5 flex gap-2.5">
        <div className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-soft">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-red/10 text-red">
            <StarSolid />
          </span>
          <div>
            <div className="text-[10.5px] font-semibold leading-none text-muted">Nível</div>
            <div className="mt-0.5 text-[13.5px] font-extrabold leading-tight">{nivel}</div>
          </div>
        </div>

        <div className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-soft">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-blue/10 text-blue">
            <ArrowUp />
          </span>
          <div>
            <div className="text-[10.5px] font-semibold leading-none text-muted">Este mês</div>
            <div className="mt-0.5 text-[13.5px] font-extrabold leading-tight">+{esteMes} pts</div>
          </div>
        </div>

        <Link
          href="/enviar-nota"
          aria-label="Enviar nota"
          className="flex w-[46px] items-center justify-center rounded-2xl bg-ink text-white shadow-soft"
        >
          <Plus />
        </Link>
      </section>

      {/* Saldo */}
      <section className="mt-6 text-center">
        <div className="text-[12.5px] font-semibold tracking-wide text-muted">Saldo de pontos</div>
        <div className="mt-1.5 text-[52px] font-extrabold leading-none tracking-tighter">
          {fmtPts(saldo)}
          <span className="ml-1.5 text-[20px] font-bold tracking-normal text-muted">pts</span>
        </div>
      </section>

      {/* Ações */}
      <section className="mt-5 flex justify-between gap-2 px-1">
        <ActionButton label="Enviar nota" primary href="/enviar-nota">
          <Camera />
        </ActionButton>
        <ActionButton label="Recompensas" href="/recompensas">
          <StarSolid />
        </ActionButton>
        <ActionButton label="Histórico" href="/historico">
          <History />
        </ActionButton>
        <ActionButton label="Mais" href="/perfil">
          <Dots />
        </ActionButton>
      </section>

      {/* Atividade */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">Últimas movimentações</h2>
          <Link href="/historico" className="text-[12.5px] font-bold text-blue hover:underline">
            Ver tudo
          </Link>
        </div>
        <AnimatedList className="flex flex-col gap-2.5">
          {atividade.length === 0 ? (
            <div className="glass rounded-[20px] p-5 text-center shadow-soft">
              <span className="text-[13px] font-medium text-muted">Nenhuma atividade recente.</span>
            </div>
          ) : (
            atividade.map((m) => (
              <AnimatedItem key={m.id}>
                <ActivityRow m={m} />
              </AnimatedItem>
            ))
          )}
        </AnimatedList>
      </section>

      <BottomNav current="home" />
    </main>
  );
}

function ActionButton({
  children,
  label,
  primary,
  href,
}: {
  children: React.ReactNode;
  label: string;
  primary?: boolean;
  href?: string;
}) {
  const box = primary
    ? "bg-gradient-to-b from-red to-red-deep text-white shadow-red"
    : "glass text-ink shadow-soft";
  const inner = (
    <>
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-[20px] transition-transform hover:-translate-y-0.5 ${box}`}
      >
        {children}
      </span>
      <span className="text-[11.5px] font-bold text-ink">{label}</span>
    </>
  );
  const cls = "flex flex-1 flex-col items-center gap-2";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button className={cls} aria-label={label}>
      {inner}
    </button>
  );
}

function ActivityRow({ m }: { m: Movimento }) {
  const pos = m.pontos >= 0;
  const titulo = m.descricao || (pos ? "Crédito de pontos" : "Resgate");
  return (
    <div className="glass flex items-center gap-3.5 rounded-[20px] p-3 shadow-soft transition-transform hover:-translate-y-0.5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          pos ? "bg-ink/5 text-blue" : "bg-red/10 text-red"
        }`}
      >
        {pos ? <Receipt width={20} height={20} /> : <Swap width={20} height={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-bold text-ink">{titulo}</div>
        <div className="mt-0.5 text-[12px] font-medium text-muted">{fmtData(m.created_at)}</div>
      </div>
      <div className={`text-[15px] font-extrabold ${pos ? "text-blue" : "text-red"}`}>
        {pos ? "+" : "−"}
        {fmtPts(Math.abs(m.pontos))} pts
      </div>
    </div>
  );
}

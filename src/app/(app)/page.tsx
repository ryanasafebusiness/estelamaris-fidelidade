import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthAndProfile } from "@/app/actions/auth";
import BottomNav from "@/components/BottomNav";
import { User, Gear, StarSolid, ArrowUp, Plus, Camera, Swap, History, Dots, Receipt, TicketPercent } from "@/components/icons";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import ScannerButton from "@/components/ScannerButton";
import PushOptIn from "@/components/PushOptIn";
import InstallPWA from "@/components/InstallPWA";

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

  const [{ data: atividadeData }, { data: mesData }, { data: configData }] = await Promise.all([
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
    supabase.from("config").select("limite_prata, limite_ouro").eq("id", true).single(),
  ]);

  const nivelRaw = profile?.nivel ?? "bronze";
  const nivel = capitalize(nivelRaw);
  const saldo = profile?.pontos_saldo ?? 0;
  const acumulado = profile?.pontos_acumulados ?? 0;
  const esteMes = (mesData ?? []).reduce((s: number, r: { pontos: number }) => s + r.pontos, 0);
  const atividade = (atividadeData ?? []) as Movimento[];

  const limitePrata = configData?.limite_prata ?? 500;
  const limiteOuro = configData?.limite_ouro ?? 2000;

  let progressoNivel = 100;
  let faltamTexto = "Nível máximo atingido";
  if (nivelRaw === "bronze") {
    progressoNivel = Math.min(100, (acumulado / limitePrata) * 100);
    faltamTexto = `Faltam ${fmtPts(Math.max(limitePrata - acumulado, 0))} pts para Prata`;
  } else if (nivelRaw === "prata") {
    progressoNivel = Math.min(100, ((acumulado - limitePrata) / (limiteOuro - limitePrata)) * 100);
    faltamTexto = `Faltam ${fmtPts(Math.max(limiteOuro - acumulado, 0))} pts para Ouro`;
  }

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
        <div className="glass flex flex-1 flex-col gap-1.5 rounded-2xl px-3 py-2.5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-red/10 text-red">
              <StarSolid />
            </span>
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold leading-none text-muted">Seu nível</div>
              <div className="mt-0.5 text-[13.5px] font-extrabold leading-tight">{nivel}</div>
            </div>
          </div>
          {nivelRaw !== "ouro" && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red to-red-deep transition-all"
                  style={{ width: `${progressoNivel}%` }}
                />
              </div>
              <div className="mt-1 truncate text-[9.5px] font-semibold text-muted">{faltamTexto}</div>
            </div>
          )}
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

      <InstallPWA />
      <PushOptIn userId={user.id} />

      {/* Saldo */}
      <section className="glass relative mt-6 overflow-hidden rounded-[26px] p-5 shadow-glass">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-red/15 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="text-[12.5px] font-semibold tracking-wide text-muted">Saldo de pontos</div>
            <div className="mt-1.5 text-[44px] font-extrabold leading-none tracking-tighter text-ink">
              {fmtPts(saldo)}
              <span className="ml-1.5 text-[18px] font-bold tracking-normal text-muted">pts</span>
            </div>
          </div>
          <Image
            src="/logo-mark.png"
            alt=""
            width={84}
            height={84}
            className="shrink-0 rounded-full shadow-red"
          />
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

      {/* Ofertas */}
      <Link
        href="/recompensas"
        className="relative mt-6 block overflow-hidden rounded-[24px] bg-gradient-to-br from-ink to-[#0b1226] p-5 text-white shadow-glass transition-transform hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-red/25 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-red">
            <TicketPercent />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold leading-tight">
              Ofertas exclusivas para você
            </div>
            <p className="mt-1 text-[12px] leading-snug text-white/70">
              Troque seus pontos por descontos especiais quando quiser.
            </p>
          </div>
        </div>
        <span className="relative mt-4 inline-block rounded-full bg-white px-4 py-2 text-[12.5px] font-extrabold text-ink">
          Ver ofertas →
        </span>
      </Link>

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

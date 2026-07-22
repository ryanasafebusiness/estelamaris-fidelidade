import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import {
  User,
  Gear,
  StarSolid,
  ArrowUp,
  Plus,
  Camera,
  Swap,
  History,
  Dots,
  Receipt,
} from "@/components/icons";
import { perfil, atividade, fmtPts, type Movimento } from "@/lib/mock";

export default function HomePage() {
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
          <div className="flex items-center justify-center">
            <img src="/logo-pontos.png" alt="Estelamaris" className="h-8 w-auto object-contain" />
          </div>
          <small className="mt-px block text-[10.5px] font-semibold tracking-wide text-muted">
            Programa de pontos
          </small>
        </div>

        <button
          aria-label="Ajustes"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <Gear />
        </button>
      </header>

      {/* Pílulas: nível / este mês / enviar */}
      <section className="mt-3.5 flex gap-2.5">
        <div className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-soft">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-red/10 text-red">
            <StarSolid />
          </span>
          <div>
            <div className="text-[10.5px] font-semibold leading-none text-muted">Nível</div>
            <div className="mt-0.5 text-[13.5px] font-extrabold leading-tight">{perfil.nivel}</div>
          </div>
        </div>

        <div className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 shadow-soft">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-blue/10 text-blue">
            <ArrowUp />
          </span>
          <div>
            <div className="text-[10.5px] font-semibold leading-none text-muted">Este mês</div>
            <div className="mt-0.5 text-[13.5px] font-extrabold leading-tight">
              +{perfil.esteMes} pts
            </div>
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
          {fmtPts(perfil.saldo)}
          <span className="ml-1.5 text-[20px] font-bold tracking-normal text-muted">pts</span>
        </div>
      </section>

      {/* Ações */}
      <section className="mt-5 flex justify-between gap-2 px-1">
        <ActionButton label="Enviar nota" primary href="/enviar-nota">
          <Camera />
        </ActionButton>
        <ActionButton label="Resgatar" href="/resgatar">
          <Swap />
        </ActionButton>
        <ActionButton label="Histórico" href="/historico">
          <History />
        </ActionButton>
        <ActionButton label="Mais">
          <Dots />
        </ActionButton>
      </section>

      {/* Atividade */}
      <section className="mt-5 flex items-center justify-between px-1">
        <h3 className="text-[17px] font-extrabold tracking-tight text-ink">Atividade</h3>
        <Link
          href="/historico"
          className="rounded-full bg-ink/5 px-3 py-1.5 text-[12.5px] font-bold text-blue transition-colors hover:bg-ink/10"
        >
          Ver tudo
        </Link>
      </section>

      <section className="no-scrollbar mt-2 flex flex-col gap-2 overflow-auto pb-1.5">
        {atividade.map((m) => (
          <ActivityRow key={m.id} m={m} />
        ))}
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
        <div className="truncate text-[14.5px] font-bold text-ink">{m.titulo}</div>
        <div className="mt-0.5 text-[12px] font-medium text-muted">{m.sub}</div>
      </div>
      <div className={`text-[15px] font-extrabold ${pos ? "text-blue" : "text-red"}`}>
        {pos ? "+" : "−"}
        {fmtPts(Math.abs(m.pontos))} pts
      </div>
    </div>
  );
}

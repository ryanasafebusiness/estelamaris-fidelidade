import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireAuthAndProfile } from "@/app/actions/auth";
import BottomNav from "@/components/BottomNav";
import { Receipt, Swap, History } from "@/components/icons";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";

function fmtData(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia) return `Hoje · ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${hora}`;
}

function fmtPts(n: number) {
  return n.toLocaleString("pt-BR");
}

export default async function HistoricoPage() {
  const { user } = await requireAuthAndProfile();
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("id, tipo, pontos, saldo_apos, descricao, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      {/* Top bar */}
      <header className="flex items-center justify-center pt-6 pb-8">
        <div className="flex flex-col items-center leading-tight">
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image src="/logo-pontos.png" alt="Estelamaris" width={110} height={32} className="h-8 w-auto object-contain" priority />
          </div>
          <small className="mt-1 block text-[10.5px] font-semibold tracking-wide text-muted">
            Programa de pontos
          </small>
        </div>
      </header>

      <div className="mb-6 px-1">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Histórico</h1>
        <p className="mt-0.5 text-[13px] font-medium text-muted">Todo o seu extrato de pontos e resgates.</p>
      </div>

      <AnimatedList className="flex-1 space-y-3 px-1 mb-8">
        {!ledger || ledger.length === 0 ? (
          <div className="glass flex flex-col items-center rounded-[20px] p-6 text-center shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-line/50 text-muted mb-3">
              <History width={24} height={24} />
            </div>
            <div className="text-[14.5px] font-bold text-ink">Nenhuma movimentação</div>
            <p className="mt-1 text-[12.5px] text-muted font-medium">Você ainda não tem histórico de pontos.</p>
          </div>
        ) : (
          ledger.map((m) => {
            const pos = m.pontos >= 0;
            const titulo = m.descricao || (pos ? "Crédito de pontos" : "Resgate");
            return (
              <AnimatedItem key={m.id} className="glass flex items-center gap-3.5 rounded-[20px] p-3.5 shadow-soft transition-transform hover:-translate-y-0.5">
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
                <div className="text-right">
                  <div className={`text-[15px] font-extrabold leading-tight ${pos ? "text-blue" : "text-red"}`}>
                    {pos ? "+" : "−"}
                    {fmtPts(Math.abs(m.pontos))} pts
                  </div>
                  {m.saldo_apos !== null && (
                    <div className="mt-0.5 text-[10px] font-bold text-muted">Saldo: {fmtPts(m.saldo_apos)}</div>
                  )}
                </div>
              </AnimatedItem>
            );
          })
        )}
      </AnimatedList>

      <BottomNav current="historico" />
    </main>
  );
}

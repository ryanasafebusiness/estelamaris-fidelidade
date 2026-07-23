"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Close } from "@/components/icons";
import BottomNav from "@/components/BottomNav";
import CodigoResgate, { type Resgate } from "@/components/CodigoResgate";
import Spinner from "@/components/Spinner";

type Redemption = {
  id: string;
  codigo: string;
  custo_pontos: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  rewards?: { titulo: string; valor_reais: number } | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataCurta(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

const statusInfo: Record<string, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "bg-blue/10 text-blue" },
  usado: { label: "Usado ✓", cls: "bg-emerald-500/15 text-emerald-600" },
  expirado: { label: "Expirado", cls: "bg-amber-500/15 text-amber-600" },
  cancelado: { label: "Cancelado", cls: "bg-red/10 text-red" },
};

export default function MeusResgatesPage() {
  const supabase = createClient();
  const [itens, setItens] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [aberto, setAberto] = useState<Resgate | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("redemptions")
      .select("id, codigo, custo_pontos, status, created_at, expires_at, rewards(titulo, valor_reais)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setItens((data ?? []) as unknown as Redemption[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      <header className="flex items-center justify-between pt-4">
        <Link
          href="/resgatar"
          aria-label="Voltar"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <Close />
        </Link>
        <div className="text-[16px] font-extrabold tracking-tight">Meus resgates</div>
        <span className="w-[38px]" />
      </header>

      <section className="mt-5 flex flex-col gap-2.5">
        {loading && <Spinner label="Carregando…" />}
        {!loading && itens.length === 0 && (
          <div className="py-10 text-center text-[13px] text-muted">
            Você ainda não resgatou nenhuma recompensa.
          </div>
        )}
        {itens.map((r) => {
          const info = statusInfo[r.status] ?? { label: r.status, cls: "bg-ink/5 text-muted" };
          return (
            <button
              key={r.id}
              onClick={() =>
                setAberto({
                  redemptionId: r.id,
                  codigo: r.codigo,
                  reward: r.rewards?.titulo || "Recompensa",
                  valor: r.rewards?.valor_reais ?? 0,
                  custo: r.custo_pontos,
                  status: r.status,
                  expira_em: r.expires_at,
                })
              }
              className="glass flex items-center gap-3 rounded-2xl p-4 text-left shadow-soft transition-colors hover:bg-white"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink">
                  {r.rewards?.titulo || "Recompensa"}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  <span className="font-mono font-bold text-ink">{r.codigo}</span> ·{" "}
                  {dataCurta(r.created_at)}
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${info.cls}`}>
                {info.label}
              </span>
            </button>
          );
        })}
      </section>

      <BottomNav current="meus-resgates" />

      {aberto && <CodigoResgate resgate={aberto} onClose={() => setAberto(null)} />}
    </main>
  );
}

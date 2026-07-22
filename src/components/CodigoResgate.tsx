"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataCurta(s: string | null) {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}

export type Resgate = {
  redemptionId: string;
  codigo: string;
  reward: string;
  valor: number;
  custo: number;
  status: string;
  expira_em: string | null;
};

const statusInfo: Record<string, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "bg-blue/10 text-blue" },
  usado: { label: "Usado ✓", cls: "bg-emerald-500/15 text-emerald-600" },
  expirado: { label: "Expirado", cls: "bg-amber-500/15 text-amber-600" },
  cancelado: { label: "Cancelado", cls: "bg-red/10 text-red" },
};

export default function CodigoResgate({
  resgate,
  onClose,
}: {
  resgate: Resgate;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [status, setStatus] = useState(resgate.status);

  // Realtime: vê virar "Usado ✓" quando o caixa dá baixa.
  useEffect(() => {
    if (status !== "ativo") return;
    const channel = supabase
      .channel(`redemption-${resgate.redemptionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "redemptions",
          filter: `id=eq.${resgate.redemptionId}`,
        },
        (payload) => {
          const novo = payload.new as { status?: string };
          if (novo.status) setStatus(novo.status);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, resgate.redemptionId, supabase]);

  const info = statusInfo[status] ?? { label: status, cls: "bg-ink/5 text-muted" };
  const usado = status === "usado";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-line glass shadow-glass">
        <div className="bg-gradient-to-b from-red to-red-deep px-6 py-5 text-center text-white">
          <div className="text-[12px] font-semibold uppercase tracking-wider opacity-80">
            estelamaris · resgate
          </div>
          <div className="mt-1 text-[19px] font-extrabold">{resgate.reward}</div>
          <div className="mt-0.5 text-[13px] font-semibold opacity-90">
            {brl(resgate.valor)} de desconto
          </div>
        </div>

        {/* QR + código */}
        <div className="border-b border-dashed border-line px-6 py-5 text-center">
          <div
            className={`mx-auto flex h-[168px] w-[168px] items-center justify-center rounded-2xl bg-white/50 dark:bg-transparent p-2 ${
              usado ? "opacity-30" : ""
            }`}
          >
            <QRCodeSVG value={resgate.codigo} size={148} level="M" />
          </div>
          <div className="mt-3 font-mono text-[26px] font-extrabold tracking-[0.15em] text-ink">
            {resgate.codigo}
          </div>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-bold ${info.cls}`}>
            {info.label}
          </span>
        </div>

        <div className="space-y-1.5 px-6 py-4 text-[12.5px]">
          <Row k="Custo" v={`${resgate.custo} pontos`} />
          <Row k="Válido até" v={dataCurta(resgate.expira_em)} />
          <p className="pt-1 text-center text-[11.5px] leading-snug text-muted">
            {usado
              ? "Este código já foi utilizado."
              : "Apresente este código (ou o QR) no caixa da farmácia para usar o desconto."}
          </p>
        </div>

        <div className="px-6 pb-6 pt-1">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-ink py-3.5 text-[14px] font-extrabold text-white transition-transform hover:-translate-y-0.5"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold text-ink">{v}</span>
    </div>
  );
}

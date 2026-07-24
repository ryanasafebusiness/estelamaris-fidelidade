"use client";

import { useEffect } from "react";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dtCompleto(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

export type NotaDescontoData = {
  codigo: string;
  reward: string;
  valor: number;
  custo: number;
  cliente: string;
  usadoEm: Date;
};

/** Cupom impresso na hora que o caixa confirma o uso de um resgate (térmica 80mm). */
export default function NotaDesconto({
  data,
  onClose,
}: {
  data: NotaDescontoData;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center">
      <div
        id="printable-receipt"
        className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-line glass shadow-glass"
      >
        {/* Cabeçalho da farmácia */}
        <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="Estelamaris" width={44} height={44} className="rounded-full" />
          <div>
            <div className="text-[14px] font-extrabold tracking-tight text-ink">
              Drogaria Estelamaris LTDA
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] font-semibold text-muted">
              CNPJ 21.135.884/0001-61
            </div>
          </div>
        </div>

        {/* Desconto aplicado */}
        <div className="border-y border-dashed border-line px-6 py-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Cupom de desconto · utilizado
          </div>
          <div className="mt-1.5 text-[34px] font-extrabold leading-none tracking-tight text-blue">
            {brl(data.valor)}
          </div>
          <div className="mt-1.5 text-[13px] font-bold text-ink">{data.reward}</div>
          <div className="mt-2 font-mono text-[18px] font-extrabold tracking-[0.2em] text-ink">
            {data.codigo}
          </div>
        </div>

        {/* Detalhes */}
        <div className="space-y-1.5 px-6 py-4 text-[12.5px]">
          <Row k="Cliente" v={data.cliente} />
          <Row k="Custo" v={`${data.custo} pontos`} />
          <Row k="Usado em" v={dtCompleto(data.usadoEm)} />
        </div>

        {/* Copy — só aparece na impressão */}
        <div className="hidden print:block border-t border-dashed border-line px-6 py-4 text-center text-[10px] font-bold uppercase leading-relaxed">
          <p>Obrigado pela preferência!</p>
          <p className="mt-1">Continue enviando suas notas e juntando pontos.</p>
          <p className="mt-2 text-[8px] opacity-70">Programa de Fidelidade Estelamaris</p>
        </div>

        <div className="print-hide flex gap-2 px-6 pb-6 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-line bg-white/50 dark:bg-transparent py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
          >
            Imprimir de novo
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-ink py-3 text-[13px] font-bold text-white transition-colors hover:opacity-90"
          >
            Próximo cliente
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

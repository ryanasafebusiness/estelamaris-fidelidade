"use client";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dt(s: string | null) {
  return s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export type ComprovanteData = {
  codigo: string;
  reward: string;
  valor_reais: number;
  custo_pontos: number;
  cliente: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
};

const statusLabel: Record<string, string> = {
  ativo: "Válido — pronto para uso",
  usado: "Utilizado",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export default function Comprovante({
  data,
  onClose,
}: {
  data: ComprovanteData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-line bg-white shadow-glass">
        {/* Topo */}
        <div className="bg-gradient-to-b from-red to-red-deep px-6 py-5 text-center text-white">
          <div className="text-[12px] font-semibold uppercase tracking-wider opacity-80">
            estelamaris · comprovante
          </div>
          <div className="mt-1 text-[19px] font-extrabold">{data.reward}</div>
          <div className="mt-0.5 text-[13px] font-semibold opacity-90">
            {brl(data.valor_reais)} de desconto
          </div>
        </div>

        {/* Código */}
        <div className="border-b border-dashed border-line px-6 py-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Código no caixa
          </div>
          <div className="mt-1 font-mono text-[30px] font-extrabold tracking-[0.2em] text-ink">
            {data.codigo}
          </div>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold ${
              data.status === "ativo"
                ? "bg-blue/10 text-blue"
                : data.status === "usado"
                  ? "bg-ink/10 text-ink"
                  : "bg-red/10 text-red"
            }`}
          >
            {statusLabel[data.status] ?? data.status}
          </span>
        </div>

        {/* Detalhes */}
        <div className="space-y-1.5 px-6 py-4 text-[12.5px]">
          <Row k="Cliente" v={data.cliente} />
          <Row k="Custo" v={`${data.custo_pontos} pontos`} />
          <Row k="Resgatado em" v={dt(data.created_at)} />
          <Row k="Válido até" v={dt(data.expires_at)} />
          {data.used_at && <Row k="Usado em" v={dt(data.used_at)} />}
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-line bg-white py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
          >
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-ink py-3 text-[13px] font-bold text-white transition-colors hover:opacity-90"
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

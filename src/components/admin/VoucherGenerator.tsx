"use client";

import { useState } from "react";
import { generatePointVoucher } from "@/app/actions/vouchers";
import { QRCodeSVG } from "qrcode.react";

export default function VoucherGenerator() {
  const [pontos, setPontos] = useState<number | "">("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!pontos || pontos <= 0) return;

    setLoading(true);
    setError(null);
    setCodigo(null);

    const result = await generatePointVoucher(Number(pontos));

    if (result.error) {
      setError(result.error);
    } else if (result.codigo) {
      setCodigo(result.codigo);
    }
    
    setLoading(false);
  }

  // URL dinâmica baseada na origem atual (ex: http://localhost:3000 ou https://meuapp.com)
  const redeemUrl = typeof window !== "undefined" && codigo 
    ? `${window.location.origin}/resgatar/${codigo}` 
    : "";

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-line glass shadow-glass p-6">
      <h2 className="text-[17px] font-extrabold text-ink mb-1">Gerar Pontos via QR Code</h2>
      <p className="text-[13px] text-muted mb-6 leading-relaxed">
        Crie um cupom contendo uma carga de pontos. O cliente lerá o código e os pontos cairão na conta dele na hora.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red/10 p-3 text-[13px] font-semibold text-red">
          {error}
        </div>
      )}

      {!codigo ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">
              Quantidade de pontos
            </label>
            <input
              type="number"
              min="1"
              required
              value={pontos}
              onChange={(e) => setPontos(e.target.value ? Number(e.target.value) : "")}
              placeholder="Ex: 50"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] font-semibold text-ink outline-none transition-all placeholder:text-muted/50 focus:border-red focus:ring-2 focus:ring-red/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !pontos}
            className="w-full rounded-xl bg-red py-3.5 text-[14px] font-bold text-white transition-transform hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar QR Code"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* O Voucher Visual - Só isso será impresso */}
          <div id="printable-receipt" className="border border-line rounded-2xl overflow-hidden bg-white text-ink text-center">
             <div className="bg-gradient-to-b from-red to-red-deep px-4 py-4 text-white">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  estelamaris · fidelidade
                </div>
                <div className="mt-1 text-[22px] font-extrabold">+{pontos} Pontos</div>
             </div>
             
             <div className="px-6 py-6 flex flex-col items-center justify-center border-b border-dashed border-line">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-line mb-4">
                  <QRCodeSVG value={redeemUrl} size={160} />
                </div>
                <div className="text-[11px] font-semibold uppercase text-muted mb-1">
                  Ou digite o código
                </div>
                <div className="font-mono text-[22px] font-extrabold tracking-[0.1em] text-ink">
                  {codigo}
                </div>
             </div>

             <div className="hidden print:block px-6 py-4 text-center text-[10px] uppercase font-bold leading-relaxed">
                <p>Farmácia Estelamaris</p>
                <p>Aponte a câmera para resgatar</p>
                <p className="mt-2 text-[8px] opacity-70">SISTEMA DE FIDELIDADE</p>
             </div>
          </div>

          <div className="flex gap-2 print-hide">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl border border-line bg-white/50 dark:bg-transparent py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
            >
              Imprimir
            </button>
            <button
              onClick={() => { setCodigo(null); setPontos(""); }}
              className="flex-1 rounded-xl bg-ink py-3 text-[13px] font-bold text-white transition-colors hover:opacity-90"
            >
              Criar outro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

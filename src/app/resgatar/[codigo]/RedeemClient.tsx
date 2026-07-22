"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemPointVoucher } from "@/app/actions/vouchers";

export default function RedeemClient({ codigo, pontos }: { codigo: string; pontos: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleRedeem() {
    setLoading(true);
    setError(null);

    const res = await redeemPointVoucher(codigo);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSuccess(true);
      // Aguarda um instante para o cliente ler a mensagem de sucesso e vai pra home
      setTimeout(() => {
        router.push("/");
      }, 2500);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 inline-flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-500/20 text-green-500 ring-8 ring-green-500/10">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-ink mb-2">+{pontos} Pontos!</h1>
        <p className="text-muted text-sm font-medium">Pontos adicionados à sua conta com sucesso.</p>
        <p className="text-muted/60 text-xs mt-4">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xs w-full glass rounded-3xl p-8 shadow-glass border border-line">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red/10 text-red">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        
        <h1 className="text-xl font-extrabold text-ink mb-1">Presente!</h1>
        <p className="text-muted text-[13px] leading-relaxed mb-6">
          Você encontrou um cupom valendo <strong className="text-ink">{pontos} pontos</strong>. 
          Toque no botão abaixo para resgatar.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red/10 p-3 text-[12px] font-semibold text-red">
            {error}
          </div>
        )}

        <button
          onClick={handleRedeem}
          disabled={loading}
          className="w-full rounded-xl bg-red py-3.5 text-[14px] font-bold text-white transition-transform hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50"
        >
          {loading ? "Resgatando..." : "Resgatar Pontos"}
        </button>
      </div>
    </div>
  );
}

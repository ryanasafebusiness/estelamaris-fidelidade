import type { Metadata } from "next";
import CaixaValidador from "@/components/CaixaValidador";

export const metadata: Metadata = {
  title: "Estelamaris — Caixa",
  description: "Validação de códigos de resgate no caixa.",
};

export default function CaixaPage() {

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-4 pb-8">


      <div className="mt-6">
        <CaixaValidador />
      </div>

      <p className="mt-5 px-2 text-center text-[12px] leading-relaxed text-muted">
        Digite ou escaneie o código do cliente, confira o valor do desconto, aplique-o no PDV e
        clique em <b className="text-ink">Confirmar uso</b>. Cada código só pode ser usado uma vez.
      </p>
    </div>
  );
}

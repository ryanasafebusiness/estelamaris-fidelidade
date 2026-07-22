"use client";

import { useState, useEffect, useActionState } from "react";
import { adminUpdateConfig } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";

type Config = {
  pontos_por_real: number;
  mult_bronze: number;
  mult_prata: number;
  mult_ouro: number;
  limite_prata: number;
  limite_ouro: number;
  dias_expiracao_resgate: number;
};

const fields: {
  name: keyof Config;
  label: string;
  step: string;
  help: string;
}[] = [
  {
    name: "pontos_por_real",
    label: "Pontos por R$ 1,00",
    step: "0.1",
    help: "Base de ganho. Ex.: 1 → uma nota de R$ 100 rende 100 pontos (antes do multiplicador de nível). O valor da nota é arredondado para baixo antes de multiplicar.",
  },
  {
    name: "mult_bronze",
    label: "Multiplicador Bronze",
    step: "0.1",
    help: "Multiplicador do nível inicial. 1,0 = ganho normal, sem bônus.",
  },
  {
    name: "mult_prata",
    label: "Multiplicador Prata",
    step: "0.1",
    help: "Ex.: 1,2 = +20% de pontos em cada nota para clientes Prata.",
  },
  {
    name: "mult_ouro",
    label: "Multiplicador Ouro",
    step: "0.1",
    help: "Ex.: 1,5 = +50% de pontos em cada nota para clientes Ouro.",
  },
  {
    name: "limite_prata",
    label: "Limite p/ Prata (pontos)",
    step: "1",
    help: "Pontos ACUMULADOS (vitalícios, não o saldo) para virar Prata. O nível nunca cai, mesmo resgatando pontos.",
  },
  {
    name: "limite_ouro",
    label: "Limite p/ Ouro (pontos)",
    step: "1",
    help: "Pontos acumulados vitalícios para virar Ouro.",
  },
  {
    name: "dias_expiracao_resgate",
    label: "Validade do resgate (dias)",
    step: "1",
    help: "Prazo para o cliente usar o código de resgate no caixa. Depois disso, o voucher expira.",
  },
];

const inputCls =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] font-bold text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";

export default function AdminConfigPage() {
  const supabase = createClient();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [state, action, pending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await adminUpdateConfig(prev, formData);
      if (result?.ok) setRefreshKey((k) => k + 1);
      return result;
    },
    {} as AdminFormState,
  );

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("config")
      .select("*")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setConfig(data as Config);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">
        Configurações
      </h1>
      <p className="mt-1 text-[14px] font-medium text-muted">
        Regras de pontuação e resgate do programa
      </p>

      {/* Como funciona */}
      <div className="glass mt-5 rounded-2xl p-4 shadow-soft sm:p-5">
        <h2 className="text-[14px] font-bold text-ink">Como o programa funciona</h2>
        <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
          <li>
            <b className="text-ink">1. Ganho:</b> o cliente envia a foto da nota. A IA lê o valor e
            credita <b className="text-ink">floor(valor) × pontos por R$ × multiplicador do nível</b>.
          </li>
          <li>
            <b className="text-ink">2. Nível:</b> definido pelos pontos <i>acumulados</i> (vitalícios).
            Bronze → Prata → Ouro conforme os limites abaixo. O nível sobe e nunca desce.
          </li>
          <li>
            <b className="text-ink">3. Resgate:</b> o cliente troca pontos por uma recompensa do
            catálogo (cada recompensa custa X pontos e vale Y reais de desconto). Isso gera um
            <b className="text-ink"> código (voucher)</b> e debita só o saldo — o acumulado não muda.
          </li>
          <li>
            <b className="text-ink">4. Caixa:</b> no balcão, o admin dá baixa no código (aba Resgates)
            e aplica o desconto. O voucher expira após a validade abaixo.
          </li>
        </ol>
      </div>

      {/* Form */}
      <div className="glass mt-6 rounded-2xl p-4 shadow-soft sm:p-6">
        <h2 className="text-[14px] font-bold text-ink">Parâmetros</h2>

        {state?.error && (
          <div className="mt-3 rounded-xl border border-red/20 bg-red/8 px-3 py-2 text-[13px] font-bold text-red">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="mt-3 rounded-xl border border-blue/20 bg-blue/8 px-3 py-2 text-[13px] font-bold text-blue">
            {state.message}
          </div>
        )}

        {loading && <div className="mt-4 text-[13px] text-muted">Carregando…</div>}

        {config && (
          <form action={action} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="text-[12.5px] font-bold text-ink">{f.label}</label>
                  <input
                    name={f.name}
                    type="number"
                    step={f.step}
                    defaultValue={config[f.name]}
                    required
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] leading-snug text-muted">{f.help}</p>
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-blue py-3 text-[14px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {pending ? "Salvando…" : "Salvar configurações"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

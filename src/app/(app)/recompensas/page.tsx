"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Close, TicketPercent } from "@/components/icons";
import Spinner from "@/components/Spinner";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import BottomNav from "@/components/BottomNav";
import CodigoResgate, { type Resgate } from "@/components/CodigoResgate";

type Reward = {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  valor_reais: number;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

export default function ResgatarPage() {
  const supabase = createClient();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<Reward | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resgate, setResgate] = useState<Resgate | null>(null);

  async function carregar() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    const [{ data: perfil }, { data: rw }] = await Promise.all([
      uid
        ? supabase.from("profiles").select("pontos_saldo").eq("id", uid).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("rewards")
        .select("id, titulo, descricao, custo_pontos, valor_reais")
        .eq("ativo", true)
        .order("custo_pontos", { ascending: true }),
    ]);
    setSaldo((perfil as { pontos_saldo: number } | null)?.pontos_saldo ?? 0);
    setRewards((rw ?? []) as Reward[]);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmarResgate() {
    if (!confirmando) return;
    setEnviando(true);
    setErro(null);
    const { data, error } = await supabase.rpc("redeem_reward", { p_reward: confirmando.id });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    const r = data as {
      codigo: string;
      custo: number;
      saldo: number;
      expira_em: string;
      redemption_id: string;
    };
    setResgate({
      redemptionId: r.redemption_id,
      codigo: r.codigo,
      reward: confirmando.titulo,
      valor: confirmando.valor_reais,
      custo: r.custo,
      status: "ativo",
      expira_em: r.expira_em,
    });
    setSaldo(r.saldo);
    setConfirmando(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      <header className="flex items-center justify-between pt-4">
        <Link
          href="/"
          aria-label="Voltar"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <Close />
        </Link>
        <div className="text-center">
          <div className="text-[16px] font-extrabold tracking-tight">Resgatar</div>
          <div className="mt-px text-[11px] font-semibold text-muted">
            Saldo: {saldo === null ? "…" : `${fmt(saldo)} pts`}
          </div>
        </div>
        <Link href="/meus-resgates" className="text-[12px] font-bold text-blue">
          Meus resgates
        </Link>
      </header>

      <section className="mt-5 flex flex-col gap-3">
        {loading && <Spinner label="Carregando recompensas…" />}
        {!loading && rewards.length === 0 && (
          <div className="py-10 text-center text-[13px] text-muted">
            Nenhuma recompensa disponível.
          </div>
        )}
        {!loading && (
          <AnimatedList className="flex flex-col gap-3">
            {rewards.map((r) => {
              const podeResgatar = saldo !== null && saldo >= r.custo_pontos;
              const falta = saldo !== null ? r.custo_pontos - saldo : 0;
              return (
                <AnimatedItem key={r.id} className="glass rounded-2xl p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red/10 text-red">
                      <TicketPercent />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-extrabold text-ink">{r.titulo}</div>
                      {r.descricao && (
                        <div className="mt-0.5 truncate text-[12px] text-muted">{r.descricao}</div>
                      )}
                      <div className="mt-1 text-[12.5px] font-extrabold text-red">
                        {brl(r.valor_reais)} de desconto
                      </div>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-ink/5 px-3.5 py-2 text-center">
                      <div className="text-[16px] font-extrabold leading-none text-ink">
                        {fmt(r.custo_pontos)}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold text-muted">pontos</div>
                    </div>
                  </div>
                  <button
                    disabled={!podeResgatar}
                    onClick={() => {
                      setErro(null);
                      setConfirmando(r);
                    }}
                    className={`mt-3.5 w-full rounded-xl py-3 text-[14px] font-extrabold transition-colors ${
                      podeResgatar
                        ? "bg-gradient-to-b from-red to-red-deep text-white shadow-red"
                        : "cursor-not-allowed bg-ink/5 text-muted"
                    }`}
                  >
                    {podeResgatar ? "Resgatar" : `Faltam ${fmt(falta)} pts`}
                  </button>
                </AnimatedItem>
              );
            })}
          </AnimatedList>
        )}
      </section>

      <BottomNav current="recompensas" />

      {/* Confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-[360px] rounded-3xl border border-line bg-white p-6 shadow-glass">
            <h3 className="text-[17px] font-extrabold text-ink">Confirmar resgate</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Você vai usar{" "}
              <b className="text-ink">{fmt(confirmando.custo_pontos)} pontos</b> e ganhar{" "}
              <b className="text-ink">{brl(confirmando.valor_reais)} de desconto</b>. Confirmar?
            </p>
            {erro && (
              <div className="mt-3 rounded-xl border border-red/20 bg-red/8 px-3 py-2 text-[13px] font-bold text-red">
                {erro}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 rounded-xl border border-line bg-white py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarResgate}
                disabled={enviando}
                className="flex-1 rounded-xl bg-gradient-to-b from-red to-red-deep py-3 text-[13px] font-extrabold text-white shadow-red disabled:opacity-60"
              >
                {enviando ? "Resgatando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Código gerado */}
      {resgate && <CodigoResgate resgate={resgate} onClose={() => setResgate(null)} />}
    </main>
  );
}

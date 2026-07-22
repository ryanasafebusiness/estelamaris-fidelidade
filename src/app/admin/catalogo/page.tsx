"use client";

import { useState, useEffect, useActionState } from "react";
import { adminCreateReward, adminUpdateReward, adminToggleReward } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";

type Reward = {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  valor_reais: number;
  ativo: boolean;
};

const inputCls =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] font-bold text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";
const labelCls = "text-[12px] font-semibold text-muted";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminCatalogoPage() {
  const supabase = createClient();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const createActionWrapped = async (prev: AdminFormState, formData: FormData) => {
    const result = await adminCreateReward(prev, formData);
    if (result?.ok) setRefreshKey((k) => k + 1);
    return result;
  };

  const [createState, createAction, createPending] = useActionState(
    createActionWrapped,
    {} as AdminFormState,
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("rewards")
      .select("*")
      .order("custo_pontos", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setRewards((data ?? []) as Reward[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Catálogo</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">
        Recompensas que o cliente troca por pontos
      </p>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-ink">Recompensas</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-xl bg-ink px-4 py-2 text-[13px] font-bold text-white transition-colors hover:opacity-90"
        >
          {showCreateForm ? "Cancelar" : "+ Nova"}
        </button>
      </div>

      {showCreateForm && (
        <div className="glass mt-4 rounded-2xl p-4 shadow-soft sm:p-5">
          {createState?.error && <Banner error>{createState.error}</Banner>}
          {createState?.ok && <Banner>{createState.message}</Banner>}
          <form action={createAction} className="mt-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Título</label>
              <input name="titulo" required placeholder="R$5 de desconto" className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Descrição</label>
              <input name="descricao" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Custo (pts)</label>
              <input name="custo_pontos" type="number" min="1" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vale (R$)</label>
              <input name="valor_reais" type="number" step="0.01" min="0" required className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <button
                type="submit"
                disabled={createPending}
                className="w-full rounded-xl bg-blue py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {createPending ? "…" : "Criar recompensa"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading && <div className="py-8 text-center text-[13px] text-muted">Carregando…</div>}
        {rewards.map((r) => (
          <RewardRow
            key={r.id}
            reward={r}
            editing={editingReward?.id === r.id}
            onEdit={() => setEditingReward(editingReward?.id === r.id ? null : r)}
            onDone={() => {
              setEditingReward(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        ))}
        {!loading && rewards.length === 0 && (
          <div className="py-8 text-center text-[13px] text-muted">
            Nenhuma recompensa cadastrada.
          </div>
        )}
      </div>
    </div>
  );
}

function Banner({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      className={`mt-3 rounded-xl border px-3 py-2 text-[13px] font-bold ${
        error ? "border-red/20 bg-red/8 text-red" : "border-blue/20 bg-blue/8 text-blue"
      }`}
    >
      {children}
    </div>
  );
}

function RewardRow({
  reward,
  editing,
  onEdit,
  onDone,
}: {
  reward: Reward;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    adminToggleReward,
    {} as AdminFormState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    adminUpdateReward,
    {} as AdminFormState,
  );

  useEffect(() => {
    if (toggleState?.ok || updateState?.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleState?.ok, updateState?.ok]);

  return (
    <div className={`glass rounded-2xl p-4 shadow-soft ${!reward.ativo ? "opacity-60" : ""}`}>
      {!editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[14px] font-bold text-ink">{reward.titulo}</span>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  reward.ativo ? "bg-blue/10 text-blue" : "bg-ink/5 text-muted"
                }`}
              >
                {reward.ativo ? "ativa" : "inativa"}
              </span>
            </div>
            {reward.descricao && (
              <div className="mt-0.5 text-[12px] text-muted">{reward.descricao}</div>
            )}
          </div>
          <div className="text-right sm:shrink-0">
            <div className="text-[15px] font-extrabold text-ink">{reward.custo_pontos} pts</div>
            <div className="text-[11px] font-semibold text-muted">vale {brl(reward.valor_reais)}</div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <button
              onClick={onEdit}
              className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-bold text-muted transition-colors hover:bg-ink/5 sm:flex-none"
            >
              Editar
            </button>
            <form action={toggleAction} className="flex-1 sm:flex-none">
              <input type="hidden" name="id" value={reward.id} />
              <input type="hidden" name="ativo" value={String(reward.ativo)} />
              <button
                type="submit"
                disabled={togglePending}
                className={`w-full rounded-xl px-3 py-2 text-[12px] font-bold transition-colors disabled:opacity-50 ${
                  reward.ativo
                    ? "border border-red/20 bg-red/10 text-red hover:bg-red/20"
                    : "bg-blue text-white hover:bg-blue-bright"
                }`}
              >
                {reward.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form
          action={updateAction}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          <input type="hidden" name="id" value={reward.id} />
          {updateState?.error && (
            <div className="col-span-2 rounded-xl border border-red/20 bg-red/8 px-3 py-2 text-[13px] font-bold text-red sm:col-span-3 lg:col-span-5">
              {updateState.error}
            </div>
          )}
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Título</label>
            <input name="titulo" defaultValue={reward.titulo} required className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Descrição</label>
            <input name="descricao" defaultValue={reward.descricao ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Custo (pts)</label>
            <input
              name="custo_pontos"
              type="number"
              min="1"
              defaultValue={reward.custo_pontos}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Vale (R$)</label>
            <input
              name="valor_reais"
              type="number"
              step="0.01"
              min="0"
              defaultValue={reward.valor_reais}
              required
              className={inputCls}
            />
          </div>
          <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
            <button
              type="submit"
              disabled={updatePending}
              className="flex-1 rounded-xl bg-blue px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

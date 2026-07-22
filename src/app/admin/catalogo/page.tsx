"use client";

import { useState, useEffect, useActionState } from "react";
import {
  adminUpdateConfig,
  adminCreateReward,
  adminUpdateReward,
  adminToggleReward,
} from "@/app/actions/admin";
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

type Reward = {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  ativo: boolean;
};

const inputCls =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] font-bold text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";
const labelCls = "text-[12px] font-semibold text-muted";

export default function AdminCatalogoPage() {
  const supabase = createClient();
  const [config, setConfig] = useState<Config | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const configActionWrapped = async (prev: AdminFormState, formData: FormData) => {
    const result = await adminUpdateConfig(prev, formData);
    if (result?.ok) setRefreshKey((k) => k + 1);
    return result;
  };
  const createActionWrapped = async (prev: AdminFormState, formData: FormData) => {
    const result = await adminCreateReward(prev, formData);
    if (result?.ok) setRefreshKey((k) => k + 1);
    return result;
  };

  const [configState, configAction, configPending] = useActionState(
    configActionWrapped,
    {} as AdminFormState,
  );
  const [createState, createAction, createPending] = useActionState(
    createActionWrapped,
    {} as AdminFormState,
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("config").select("*").eq("id", true).single(),
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
    ]).then(([{ data: cfg }, { data: rw }]) => {
      if (cancelled) return;
      if (cfg) setConfig(cfg as Config);
      setRewards((rw ?? []) as Reward[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="py-12 text-center text-[14px] font-medium text-muted">Carregando…</div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Catálogo</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">Parâmetros do programa e recompensas</p>

      {/* Config */}
      <section className="glass mt-6 rounded-2xl p-4 shadow-soft sm:p-6">
        <h2 className="text-[16px] font-bold text-ink">Parâmetros de pontos</h2>

        {configState?.error && <Banner error>{configState.error}</Banner>}
        {configState?.ok && <Banner>{configState.message}</Banner>}

        {config && (
          <form action={configAction} className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <ConfigField label="Pontos por R$" name="pontos_por_real" value={config.pontos_por_real} step="0.1" />
            <ConfigField label="Mult. Bronze" name="mult_bronze" value={config.mult_bronze} step="0.1" />
            <ConfigField label="Mult. Prata" name="mult_prata" value={config.mult_prata} step="0.1" />
            <ConfigField label="Mult. Ouro" name="mult_ouro" value={config.mult_ouro} step="0.1" />
            <ConfigField label="Limite Prata (pts)" name="limite_prata" value={config.limite_prata} step="1" />
            <ConfigField label="Limite Ouro (pts)" name="limite_ouro" value={config.limite_ouro} step="1" />
            <ConfigField label="Validade resgate (dias)" name="dias_expiracao_resgate" value={config.dias_expiracao_resgate} step="1" />
            <div className="flex items-end">
              <button
                type="submit"
                disabled={configPending}
                className="w-full rounded-xl bg-blue py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
              >
                {configPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Rewards */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
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
            <form action={createAction} className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Título</label>
                <input name="titulo" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <input name="descricao" className={inputCls} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Custo (pts)</label>
                  <input name="custo_pontos" type="number" min="1" required className={inputCls} />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={createPending}
                    className="rounded-xl bg-blue px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
                  >
                    {createPending ? "…" : "Criar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="mt-4 space-y-2">
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
          {rewards.length === 0 && (
            <div className="py-8 text-center text-[13px] text-muted">
              Nenhuma recompensa cadastrada.
            </div>
          )}
        </div>
      </section>
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

function ConfigField({
  label,
  name,
  value,
  step,
}: {
  label: string;
  name: string;
  value: number;
  step: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input name={name} type="number" step={step} defaultValue={value} required className={inputCls} />
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
          <div className="text-[15px] font-extrabold text-ink sm:shrink-0">
            {reward.custo_pontos} pts
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
        <form action={updateAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="id" value={reward.id} />
          {updateState?.error && (
            <div className="rounded-xl border border-red/20 bg-red/8 px-3 py-2 text-[13px] font-bold text-red sm:col-span-2 lg:col-span-4">
              {updateState.error}
            </div>
          )}
          <div>
            <label className={labelCls}>Título</label>
            <input name="titulo" defaultValue={reward.titulo} required className={inputCls} />
          </div>
          <div>
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
          <div className="flex items-end gap-2">
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

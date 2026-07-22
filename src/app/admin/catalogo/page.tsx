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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="animate-page-in py-12 text-center text-[14px] font-medium text-white/30">
        Carregando...
      </div>
    );
  }

  return (
    <div className="animate-page-in">
      <h1 className="text-[24px] font-extrabold tracking-tight text-white">Catálogo</h1>
      <p className="mt-1 text-[14px] font-medium text-white/40">
        Parâmetros do programa e recompensas
      </p>

      {/* ── Config ── */}
      <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <h2 className="text-[16px] font-bold text-white/80">Parâmetros de Pontos</h2>

        {configState?.error && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-400">
            {configState.error}
          </div>
        )}
        {configState?.ok && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-400">
            {configState.message}
          </div>
        )}

        {config && (
          <form action={configAction} className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                className="w-full rounded-xl bg-blue-500/80 py-3 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {configPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Rewards ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-white/80">Recompensas</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-xl bg-white/10 px-4 py-2 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/15"
          >
            {showCreateForm ? "Cancelar" : "+ Nova"}
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            {createState?.error && (
              <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-400">
                {createState.error}
              </div>
            )}
            {createState?.ok && (
              <div className="mb-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-400">
                {createState.message}
              </div>
            )}
            <form action={createAction} className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[12px] font-bold text-white/50">Título</label>
                <input
                  name="titulo"
                  required
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-white/50">Descrição</label>
                <input
                  name="descricao"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white outline-none focus:border-white/20"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] font-bold text-white/50">Custo (pts)</label>
                  <input
                    name="custo_pontos"
                    type="number"
                    min="1"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white outline-none focus:border-white/20"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={createPending}
                    className="rounded-xl bg-emerald-500/80 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {createPending ? "..." : "Criar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Rewards list */}
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
            <div className="py-8 text-center text-[13px] text-white/30">
              Nenhuma recompensa cadastrada.
            </div>
          )}
        </div>
      </section>
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
      <label className="text-[12px] font-bold text-white/50">{label}</label>
      <input
        name={name}
        type="number"
        step={step}
        defaultValue={value}
        required
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] font-bold text-white outline-none focus:border-white/20"
      />
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
    <div
      className={`rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-colors ${!reward.ativo ? "opacity-50" : ""}`}
    >
      {!editing ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-white">{reward.titulo}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${reward.ativo ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/30"}`}
              >
                {reward.ativo ? "ativa" : "inativa"}
              </span>
            </div>
            {reward.descricao && (
              <div className="mt-0.5 text-[12px] text-white/40">{reward.descricao}</div>
            )}
          </div>
          <div className="text-[15px] font-extrabold text-white/70">
            {reward.custo_pontos} pts
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-white/50 transition-colors hover:bg-white/10"
            >
              Editar
            </button>
            <form action={toggleAction}>
              <input type="hidden" name="id" value={reward.id} />
              <input type="hidden" name="ativo" value={String(reward.ativo)} />
              <button
                type="submit"
                disabled={togglePending}
                className={`rounded-xl px-3 py-2 text-[12px] font-bold transition-colors disabled:opacity-50 ${
                  reward.ativo
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {reward.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={updateAction} className="grid grid-cols-4 gap-3">
          <input type="hidden" name="id" value={reward.id} />
          {updateState?.error && (
            <div className="col-span-4 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {updateState.error}
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold text-white/50">Título</label>
            <input
              name="titulo"
              defaultValue={reward.titulo}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-bold text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-white/50">Descrição</label>
            <input
              name="descricao"
              defaultValue={reward.descricao ?? ""}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-white/50">Custo (pts)</label>
            <input
              name="custo_pontos"
              type="number"
              min="1"
              defaultValue={reward.custo_pontos}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-bold text-white outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={updatePending}
              className="rounded-xl bg-blue-500/80 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl bg-white/5 px-4 py-2 text-[13px] font-bold text-white/50"
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

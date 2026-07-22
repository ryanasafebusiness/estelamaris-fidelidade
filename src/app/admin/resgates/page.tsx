"use client";

import { useState, useEffect, useActionState } from "react";
import { adminMarkRedemptionUsed } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";

type Redemption = {
  id: string;
  codigo: string;
  custo_pontos: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  user_id: string;
  profiles?: { nome: string | null } | null;
  rewards?: { titulo: string } | null;
};

export default function AdminResgatesPage() {
  const supabase = createClient();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [markState, markAction, markPending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await adminMarkRedemptionUsed(prev, formData);
      if (result?.ok) setRefreshKey((k) => k + 1);
      return result;
    },
    {} as AdminFormState,
  );

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("redemptions")
      .select("*, profiles(nome), rewards(titulo)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) {
          setRedemptions((data ?? []) as Redemption[]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = search
    ? redemptions.filter(
        (r) =>
          r.codigo.includes(search.toUpperCase()) ||
          (r.profiles as { nome: string | null } | null)?.nome
            ?.toLowerCase()
            .includes(search.toLowerCase()),
      )
    : redemptions;

  return (
    <div className="animate-page-in">
      <h1 className="text-[24px] font-extrabold tracking-tight text-white">Resgates</h1>
      <p className="mt-1 text-[14px] font-medium text-white/40">
        Baixa de códigos de resgate no caixa
      </p>

      {/* Quick use form */}
      <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
        <h2 className="text-[14px] font-bold text-white/70">Dar baixa rápida</h2>
        {markState?.error && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-400">
            {markState.error}
          </div>
        )}
        {markState?.ok && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-400">
            {markState.message}
          </div>
        )}
        <form action={markAction} className="mt-3 flex gap-3">
          <input
            name="codigo"
            placeholder="Código do resgate (ex: A1B2C3D4)"
            required
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-bold uppercase tracking-wider text-white outline-none placeholder:text-white/20 focus:border-white/20"
          />
          <button
            type="submit"
            disabled={markPending}
            className="rounded-xl bg-emerald-500/80 px-6 py-3 text-[13px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {markPending ? "..." : "Usar"}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white outline-none placeholder:text-white/20 focus:border-white/20"
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Código
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Recompensa
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Pontos
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                Data
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-white/30">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-white/30">
                  Nenhum resgate encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-mono text-[13px] font-bold tracking-wider text-white">
                    {r.codigo}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">
                    {(r.profiles as { nome: string | null } | null)?.nome || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">
                    {(r.rewards as { titulo: string } | null)?.titulo || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-white/70">
                    {r.custo_pontos}
                  </td>
                  <td className="px-4 py-3">
                    <RedemptionBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-white/40">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "ativo" && (
                      <form action={markAction}>
                        <input type="hidden" name="codigo" value={r.codigo} />
                        <button
                          type="submit"
                          disabled={markPending}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          Usar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RedemptionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: "bg-blue-500/20 text-blue-400",
    usado: "bg-emerald-500/20 text-emerald-400",
    expirado: "bg-amber-500/20 text-amber-400",
    cancelado: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${styles[status] || "bg-white/10 text-white/50"}`}
    >
      {status}
    </span>
  );
}

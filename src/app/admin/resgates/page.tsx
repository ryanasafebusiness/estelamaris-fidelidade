"use client";

import { useState, useEffect, useActionState } from "react";
import { adminMarkRedemptionUsed } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import Comprovante, { type ComprovanteData } from "@/components/admin/Comprovante";

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
  rewards?: { titulo: string; valor_reais: number } | null;
};

export default function AdminResgatesPage() {
  const supabase = createClient();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);
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
      .select("*, profiles(nome), rewards(titulo, valor_reais)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) {
          setRedemptions((data ?? []) as Redemption[]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = search
    ? redemptions.filter(
        (r) =>
          r.codigo.includes(search.toUpperCase()) ||
          r.profiles?.nome?.toLowerCase().includes(search.toLowerCase()),
      )
    : redemptions;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">
            Resgates
          </h1>
          <p className="mt-1 text-[14px] font-medium text-muted">Baixa de códigos de resgate</p>
        </div>
        <a
          href="/caixa"
          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:opacity-90"
        >
          Abrir caixa →
        </a>
      </div>

      {/* Baixa rápida */}
      <div className="glass mt-6 rounded-2xl p-4 shadow-soft sm:p-5">
        <h2 className="text-[14px] font-bold text-ink">Dar baixa rápida</h2>
        {markState?.error && (
          <div className="mt-3 rounded-xl border border-red/20 bg-red/8 px-3 py-2 text-[13px] font-bold text-red">
            {markState.error}
          </div>
        )}
        {markState?.ok && (
          <div className="mt-3 rounded-xl border border-blue/20 bg-blue/8 px-3 py-2 text-[13px] font-bold text-blue">
            {markState.message}
          </div>
        )}
        <form action={markAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            name="codigo"
            placeholder="Código do resgate (ex: A1B2C3D4)"
            required
            className="flex-1 rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-3 text-[14px] font-bold uppercase tracking-wider text-ink outline-none placeholder:font-medium placeholder:normal-case placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
          <button
            type="submit"
            disabled={markPending}
            className="rounded-xl bg-blue px-6 py-3 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
          >
            {markPending ? "…" : "Usar"}
          </button>
        </form>
      </div>

      {/* Busca */}
      <div className="mt-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome…"
          className="w-full rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-3 text-[13px] font-medium text-ink outline-none placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>

      {/* Tabela (scroll horizontal no mobile) */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white/50 dark:bg-transparent shadow-soft">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-line bg-ink/[0.02]">
              {["Código", "Cliente", "Recompensa", "Pontos", "Status", "Data", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-muted">
                  Nenhum resgate encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-line transition-colors hover:bg-ink/[0.02]">
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setComprovante({
                          codigo: r.codigo,
                          reward: r.rewards?.titulo || "Recompensa",
                          valor_reais: r.rewards?.valor_reais ?? 0,
                          custo_pontos: r.custo_pontos,
                          cliente: r.profiles?.nome || "—",
                          status: r.status,
                          created_at: r.created_at,
                          expires_at: r.expires_at,
                          used_at: r.used_at,
                        })
                      }
                      className="font-mono text-[13px] font-bold tracking-wider text-blue hover:underline"
                    >
                      {r.codigo}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink/70">{r.profiles?.nome || "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-ink/70">{r.rewards?.titulo || "—"}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-ink">{r.custo_pontos}</td>
                  <td className="px-4 py-3">
                    <RedemptionBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "ativo" && (
                      <form action={markAction}>
                        <input type="hidden" name="codigo" value={r.codigo} />
                        <button
                          type="submit"
                          disabled={markPending}
                          className="rounded-lg bg-blue px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
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

      {comprovante && <Comprovante data={comprovante} onClose={() => setComprovante(null)} />}
    </div>
  );
}

function RedemptionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: "bg-blue/10 text-blue",
    usado: "bg-ink/10 text-ink",
    expirado: "bg-amber-500/15 text-amber-600",
    cancelado: "bg-red/10 text-red",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${styles[status] || "bg-ink/5 text-muted"}`}
    >
      {status}
    </span>
  );
}

"use client";

import { useState, useActionState, useEffect } from "react";
import { adminApproveReceipt, adminRejectReceipt } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";

type Receipt = {
  id: string;
  status: string;
  valor: number | null;
  pontos_gerados: number;
  estabelecimento: string | null;
  motivo_rejeicao: string | null;
  storage_path: string | null;
  ai_result: Record<string, unknown> | null;
  created_at: string;
  user_id: string;
  profiles?: { nome: string | null } | null;
};

export default function AdminNotasPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState<"pendente" | "aprovada" | "rejeitada" | "todas">("pendente");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalReceipt, setModalReceipt] = useState<Receipt | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchReceipts() {
      let query = supabase
        .from("receipts")
        .select("*, profiles(nome)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "todas") query = query.eq("status", filter);

      const { data } = await query;
      if (cancelled) return;
      const items = (data ?? []) as Receipt[];
      setReceipts(items);
      setLoading(false);

      const urls: Record<string, string> = {};
      for (const r of items) {
        if (r.storage_path) {
          const { data: urlData } = await supabase.storage
            .from("notas")
            .createSignedUrl(r.storage_path, 3600);
          if (urlData?.signedUrl) urls[r.id] = urlData.signedUrl;
        }
      }
      if (!cancelled) setImageUrls(urls);
    }

    fetchReceipts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  const filters: { key: typeof filter; label: string }[] = [
    { key: "pendente", label: "Pendentes" },
    { key: "aprovada", label: "Aprovadas" },
    { key: "rejeitada", label: "Rejeitadas" },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Notas</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">Moderação de notas fiscais</p>

      {/* Filtros */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              filter === f.key ? "bg-ink text-white" : "text-muted hover:bg-ink/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-5 space-y-3">
        {loading && <Empty>Carregando…</Empty>}
        {!loading && receipts.length === 0 && <Empty>Nenhuma nota encontrada.</Empty>}

        {!loading &&
          receipts.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-3 shadow-soft sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  {/* Thumbnail */}
                  <div className="h-[80px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-ink/5">
                    {imageUrls[r.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrls[r.id]}
                        alt="Nota"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted">
                        sem img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="truncate text-[13px] font-bold text-ink">
                        {r.profiles?.nome || "—"}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted">
                      {r.valor ? `R$ ${r.valor.toFixed(2)}` : "Valor não lido"} ·{" "}
                      {r.pontos_gerados > 0 ? `${r.pontos_gerados} pts` : "—"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </div>
                    {r.estabelecimento && (
                      <div className="mt-0.5 truncate text-[11px] text-muted">
                        {r.estabelecimento}
                      </div>
                    )}
                    {r.motivo_rejeicao && (
                      <div className="mt-1 text-[11px] font-semibold text-red">
                        Motivo: {r.motivo_rejeicao}
                      </div>
                    )}
                    {r.ai_result && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[11px] text-muted hover:text-ink">
                          Ver dados da IA
                        </summary>
                        <pre className="mt-1 max-h-[120px] overflow-auto rounded-lg bg-ink/5 p-2 text-[10px] text-ink/70">
                          {JSON.stringify(r.ai_result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {r.status === "pendente" && (
                  <div className="flex gap-2 sm:shrink-0 sm:flex-col">
                    <button
                      onClick={() => {
                        setModalReceipt(r);
                        setModalType("approve");
                      }}
                      className="flex-1 rounded-xl bg-blue px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-blue-bright"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setModalReceipt(r);
                        setModalType("reject");
                      }}
                      className="flex-1 rounded-xl border border-red/20 bg-red/10 px-3 py-2 text-[12px] font-bold text-red transition-colors hover:bg-red/20"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {modalReceipt && modalType && (
        <Modal
          receipt={modalReceipt}
          type={modalType}
          onClose={() => {
            setModalReceipt(null);
            setModalType(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-[14px] font-medium text-muted">{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendente: "bg-amber-500/15 text-amber-600",
    processando: "bg-amber-500/15 text-amber-600",
    aprovada: "bg-blue/10 text-blue",
    rejeitada: "bg-red/10 text-red",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${styles[status] || "bg-ink/5 text-muted"}`}
    >
      {status}
    </span>
  );
}

function Modal({
  receipt,
  type,
  onClose,
}: {
  receipt: Receipt;
  type: "approve" | "reject";
  onClose: () => void;
}) {
  const action = type === "approve" ? adminApproveReceipt : adminRejectReceipt;
  const [state, formAction, isPending] = useActionState(action, {} as AdminFormState);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onClose, 800);
      return () => clearTimeout(t);
    }
  }, [state?.ok, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-[400px] rounded-3xl border border-line bg-white p-6 shadow-glass">
        <h3 className="text-[17px] font-extrabold text-ink">
          {type === "approve" ? "Aprovar nota" : "Rejeitar nota"}
        </h3>

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

        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="receipt_id" value={receipt.id} />

          {type === "approve" ? (
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink">
                Valor da nota (R$)
              </label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={receipt.valor?.toFixed(2) ?? ""}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] font-bold text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink">
                Motivo da rejeição
              </label>
              <textarea
                name="motivo"
                rows={3}
                placeholder="Ex: imagem ilegível, nota de outro estabelecimento…"
                className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-[14px] font-medium text-ink outline-none placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line bg-white py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 rounded-xl py-3 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${
                type === "approve" ? "bg-blue hover:bg-blue-bright" : "bg-red hover:bg-red-deep"
              }`}
            >
              {isPending ? "Processando…" : type === "approve" ? "Aprovar" : "Rejeitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

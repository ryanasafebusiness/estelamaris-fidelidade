"use client";

import { useState, useActionState } from "react";
import { adminApproveReceipt, adminRejectReceipt } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

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
  profiles?: { nome: string | null; email?: string } | null;
};

export default function AdminNotasPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState<"pendente" | "aprovada" | "rejeitada" | "todas">(
    "pendente",
  );
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

      if (filter !== "todas") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      if (cancelled) return;
      const items = (data ?? []) as Receipt[];
      setReceipts(items);
      setLoading(false);

      // Generate signed URLs for images
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  const openApprove = (r: Receipt) => {
    setModalReceipt(r);
    setModalType("approve");
  };
  const openReject = (r: Receipt) => {
    setModalReceipt(r);
    setModalType("reject");
  };
  const closeModal = () => {
    setModalReceipt(null);
    setModalType(null);
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: "pendente", label: "Pendentes" },
    { key: "aprovada", label: "Aprovadas" },
    { key: "rejeitada", label: "Rejeitadas" },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div className="animate-page-in">
      <h1 className="text-[24px] font-extrabold tracking-tight text-white">Notas</h1>
      <p className="mt-1 text-[14px] font-medium text-white/40">
        Moderação de notas fiscais
      </p>

      {/* Filters */}
      <div className="mt-5 flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-colors ${
              filter === f.key
                ? "bg-white/10 text-white"
                : "text-white/40 hover:bg-white/5 hover:text-white/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 space-y-3">
        {loading && (
          <div className="py-12 text-center text-[14px] font-medium text-white/30">
            Carregando...
          </div>
        )}

        {!loading && receipts.length === 0 && (
          <div className="py-12 text-center text-[14px] font-medium text-white/30">
            Nenhuma nota encontrada.
          </div>
        )}

        {!loading &&
          receipts.map((r) => (
            <div
              key={r.id}
              className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
            >
              {/* Thumbnail */}
              <div className="h-[80px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                {imageUrls[r.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrls[r.id]}
                    alt="Nota"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/20">
                    sem img
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="truncate text-[13px] font-bold text-white/70">
                    {(r.profiles as { nome: string | null } | null)?.nome || "—"}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-white/40">
                  {r.valor ? `R$ ${r.valor.toFixed(2)}` : "Valor não lido"} ·{" "}
                  {r.pontos_gerados > 0 ? `${r.pontos_gerados} pts` : "—"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </div>
                {r.estabelecimento && (
                  <div className="mt-0.5 truncate text-[11px] text-white/30">
                    {r.estabelecimento}
                  </div>
                )}
                {r.motivo_rejeicao && (
                  <div className="mt-1 text-[11px] text-red-400">
                    Motivo: {r.motivo_rejeicao}
                  </div>
                )}
                {r.ai_result && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[11px] text-white/25 hover:text-white/40">
                      Ver dados IA
                    </summary>
                    <pre className="mt-1 max-h-[120px] overflow-auto rounded-lg bg-black/30 p-2 text-[10px] text-white/50">
                      {JSON.stringify(r.ai_result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Actions */}
              {r.status === "pendente" && (
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => openApprove(r)}
                    className="rounded-xl bg-emerald-500/20 px-3 py-2 text-[12px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/30"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => openReject(r)}
                    className="rounded-xl bg-red-500/20 px-3 py-2 text-[12px] font-bold text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Modal */}
      {modalReceipt && modalType && (
        <Modal
          receipt={modalReceipt}
          type={modalType}
          onClose={() => {
            closeModal();
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendente: "bg-amber-500/20 text-amber-400",
    aprovada: "bg-emerald-500/20 text-emerald-400",
    rejeitada: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${styles[status] || "bg-white/10 text-white/50"}`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#1a2332] p-6">
        <h3 className="text-[17px] font-extrabold text-white">
          {type === "approve" ? "Aprovar Nota" : "Rejeitar Nota"}
        </h3>

        {state?.error && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-400">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-400">
            {state.message}
          </div>
        )}

        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="receipt_id" value={receipt.id} />

          {type === "approve" ? (
            <div>
              <label className="text-[12px] font-bold text-white/50">
                Valor da nota (R$)
              </label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={receipt.valor?.toFixed(2) ?? ""}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-bold text-white outline-none focus:border-white/20"
              />
            </div>
          ) : (
            <div>
              <label className="text-[12px] font-bold text-white/50">
                Motivo da rejeição
              </label>
              <textarea
                name="motivo"
                rows={3}
                placeholder="Ex: imagem ilegível, nota de outro estabelecimento..."
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] font-medium text-white outline-none placeholder:text-white/20 focus:border-white/20"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-3 text-[13px] font-bold text-white/50 transition-colors hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 rounded-xl py-3 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${
                type === "approve"
                  ? "bg-emerald-500/80 hover:bg-emerald-500"
                  : "bg-red-500/80 hover:bg-red-500"
              }`}
            >
              {isPending ? "Processando..." : type === "approve" ? "Aprovar" : "Rejeitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useActionState, useEffect } from "react";
import { adminApproveReceipt, adminRejectReceipt } from "@/app/actions/admin";
import type { AdminFormState } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";
import ReceiptDetailModal from "@/components/admin/ReceiptDetailModal";

type Receipt = {
  id: string;
  status: string;
  valor: number | null;
  pontos_gerados: number;
  estabelecimento: string | null;
  cnpj: string | null;
  chave_acesso: string | null;
  data_compra: string | null;
  motivo_rejeicao: string | null;
  storage_path: string | null;
  created_at: string;
  user_id: string;
  profiles?: { nome: string | null; cpf: string | null; telefone: string | null } | null;
};

export default function NotasCaixaClient() {
  const supabase = createClient();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalReceipt, setModalReceipt] = useState<Receipt | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [detalhe, setDetalhe] = useState<Receipt | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchReceipts() {
      // Caixa vê apenas notas pendentes
      const { data } = await supabase
        .from("receipts")
        .select("*, profiles(nome, cpf, telefone)")
        .eq("status", "pendente")
        .order("created_at", { ascending: false })
        .limit(50);
        
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
    
    // Configura tempo real para novas notas
    const channel = supabase
      .channel("caixa_notas_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts", filter: "status=eq.pendente" },
        () => setRefreshKey((k) => k + 1)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [refreshKey, supabase]);

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col px-4 py-8">
      <div className="mb-6">
        <h2 className="text-[20px] font-extrabold tracking-tight text-ink">Aprovação de Notas</h2>
        <p className="text-[13px] font-medium text-muted">
          Confira o valor e aprove as notas enviadas pelos clientes para gerar os pontos.
        </p>
      </div>

      <div className="space-y-3">
        {loading && <Spinner label="Buscando notas pendentes…" />}
        {!loading && receipts.length === 0 && <Empty>Ufa! A fila está zerada, nenhuma nota pendente no momento.</Empty>}

        {!loading &&
          receipts.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-3 shadow-soft sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setDetalhe(r)}
                  className="flex min-w-0 flex-1 gap-3 text-left"
                >
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
                      <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                        {r.status}
                      </span>
                      <span className="truncate text-[14px] font-extrabold text-ink">
                        {r.profiles?.nome || "Cliente sem nome"}
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-muted">
                      {r.valor ? `R$ ${r.valor.toFixed(2)} lido` : "Valor pendente"}
                    </div>
                    {r.estabelecimento && (
                      <div className="mt-1 truncate text-[12px] text-muted">
                        {r.estabelecimento}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-muted/70">
                      Enviada em {new Date(r.created_at).toLocaleDateString("pt-BR")} às {new Date(r.created_at).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </button>

                {/* Ações */}
                <div className="flex gap-2 sm:shrink-0 sm:flex-col">
                  <button
                    onClick={() => {
                      setModalReceipt(r);
                      setModalType("approve");
                    }}
                    className="flex-1 rounded-xl bg-blue px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-bright"
                  >
                    Validar
                  </button>
                  <button
                    onClick={() => {
                      setModalReceipt(r);
                      setModalType("reject");
                    }}
                    className="flex-1 rounded-xl border border-red/20 bg-red/10 px-4 py-2.5 text-[13px] font-bold text-red transition-colors hover:bg-red/20"
                  >
                    Recusar
                  </button>
                </div>
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

      {detalhe && (
        <ReceiptDetailModal
          receipt={detalhe as any}
          cliente={{
            nome: detalhe.profiles?.nome ?? null,
            cpf: detalhe.profiles?.cpf ?? null,
            telefone: detalhe.profiles?.telefone ?? null,
          }}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-[14px] font-medium text-muted">{children}</div>;
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
      <div className="w-full max-w-[400px] rounded-3xl border border-line bg-white/50 dark:bg-transparent p-6 shadow-glass">
        <h3 className="text-[17px] font-extrabold text-ink">
          {type === "approve" ? "Aprovar Nota Fiscal" : "Recusar Nota Fiscal"}
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

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="receipt_id" value={receipt.id} />

          {type === "approve" ? (
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-ink">
                Qual é o valor final da compra? (R$)
              </label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={receipt.valor?.toFixed(2) ?? ""}
                className="w-full rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-3 text-[15px] font-bold text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <p className="mt-2 text-[12px] text-muted">Confira o valor na foto antes de confirmar. Os pontos serão dados com base nesse valor.</p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-ink">
                Motivo da recusa
              </label>
              <textarea
                name="motivo"
                rows={3}
                placeholder="Ex: Foto desfocada, data antiga, etc..."
                required
                className="w-full resize-none rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-3 text-[14px] font-medium text-ink outline-none placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line bg-white/50 dark:bg-transparent py-3.5 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 rounded-xl py-3.5 text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${
                type === "approve" ? "bg-blue hover:bg-blue-bright" : "bg-red hover:bg-red-deep"
              }`}
            >
              {isPending ? "Processando…" : type === "approve" ? "Aprovar e Pontuar" : "Recusar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

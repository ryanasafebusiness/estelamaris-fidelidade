"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ReceiptFull = {
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
  ai_result: Record<string, unknown> | null;
  created_at: string;
  processed_at: string | null;
};

type ClienteInfo = { nome: string | null; cpf: string | null; telefone: string | null };

function brl(n: number | null) {
  return n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dt(s: string | null) {
  return s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
}
function dataCurta(s: string | null) {
  return s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";
}
function fmtCnpj(v: string | null) {
  const d = (v || "").replace(/\D/g, "");
  if (d.length !== 14) return v || "—";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
function fmtChave(v: string | null) {
  const d = (v || "").replace(/\D/g, "");
  if (!d) return "—";
  return d.match(/.{1,4}/g)?.join(" ") ?? d;
}

const statusStyles: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-600",
  processando: "bg-amber-500/15 text-amber-600",
  aprovada: "bg-blue/10 text-blue",
  rejeitada: "bg-red/10 text-red",
};

export default function ReceiptDetailModal({
  receipt,
  cliente,
  onClose,
}: {
  receipt: ReceiptFull;
  cliente?: ClienteInfo;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!receipt.storage_path) return;
    supabase.storage
      .from("notas")
      .createSignedUrl(receipt.storage_path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setImageUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.storage_path]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl border border-line glass shadow-glass sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-extrabold text-ink">Detalhes da nota</h3>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${statusStyles[receipt.status] || "bg-ink/5 text-muted"}`}>
                {receipt.status}
              </span>
            </div>
            {cliente?.nome && <div className="mt-0.5 text-[12px] text-muted">{cliente.nome}</div>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-muted"
          >
            Fechar
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* Imagem */}
          {imageUrl && (
            <button
              onClick={() => setZoom(true)}
              className="mb-4 block w-full overflow-hidden rounded-2xl bg-ink/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Nota fiscal" className="max-h-[260px] w-full object-contain" />
            </button>
          )}
          {!imageUrl && receipt.storage_path && (
            <div className="mb-4 flex h-[140px] items-center justify-center rounded-2xl bg-ink/5 text-[12px] text-muted">
              Carregando imagem…
            </div>
          )}

          {/* Valor em destaque */}
          <div className="rounded-2xl bg-ink/[0.03] p-4">
            <div className="text-[11px] font-semibold text-muted">Valor da nota</div>
            <div className="mt-0.5 text-[26px] font-extrabold tracking-tight text-ink">
              {brl(receipt.valor)}
            </div>
            {receipt.pontos_gerados > 0 && (
              <div className="mt-1 text-[13px] font-bold text-blue">
                +{receipt.pontos_gerados} pontos creditados
              </div>
            )}
          </div>

          {receipt.motivo_rejeicao && (
            <div className="mt-3 rounded-2xl border border-red/20 bg-red/8 p-3.5 text-[13px] font-bold text-red">
              Motivo da rejeição: {receipt.motivo_rejeicao}
            </div>
          )}

          {/* Dados da nota */}
          <div className="mt-4 space-y-2 text-[12.5px]">
            <Row k="Estabelecimento" v={receipt.estabelecimento || "—"} />
            <Row k="CNPJ" v={fmtCnpj(receipt.cnpj)} mono />
            <Row k="Data da compra" v={dataCurta(receipt.data_compra)} />
            <Row k="Chave de acesso" v={fmtChave(receipt.chave_acesso)} mono small />
            {cliente?.cpf && <Row k="CPF do cliente" v={cliente.cpf} mono />}
            {cliente?.telefone && <Row k="Telefone" v={cliente.telefone} />}
            <Row k="Enviada em" v={dt(receipt.created_at)} />
            <Row k="Processada em" v={dt(receipt.processed_at)} />
          </div>

          {/* Dados brutos da IA */}
          {receipt.ai_result && (
            <details className="mt-4">
              <summary className="cursor-pointer text-[12px] font-bold text-muted hover:text-ink">
                Ver resposta bruta da IA
              </summary>
              <pre className="mt-2 max-h-[160px] overflow-auto rounded-xl bg-ink/5 p-3 text-[10.5px] text-ink/70">
                {JSON.stringify(receipt.ai_result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* Zoom da imagem */}
      {zoom && imageUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Nota fiscal (ampliada)" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function Row({ k, v, mono, small }: { k: string; v: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted">{k}</span>
      <span
        className={`text-right font-semibold text-ink ${mono ? "font-mono" : ""} ${small ? "text-[11px] tracking-wide" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}

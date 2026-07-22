"use client";

import { useState } from "react";
import { caixaLookup, adminMarkRedemptionUsed, type CaixaResult } from "@/app/actions/admin";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataCurta(s: string | null | undefined) {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}

export default function CaixaValidador() {
  const [codigo, setCodigo] = useState("");
  const [res, setRes] = useState<CaixaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function validar() {
    if (!codigo.trim()) return;
    setLoading(true);
    setErro(null);
    setConfirmado(false);
    setRes(null);
    const r = await caixaLookup(codigo);
    setLoading(false);
    if (!r.found) {
      setErro(r.error ?? "Código não encontrado.");
      return;
    }
    setRes(r);
  }

  async function confirmarUso() {
    if (!res?.codigo) return;
    setConfirmando(true);
    setErro(null);
    const fd = new FormData();
    fd.set("codigo", res.codigo);
    const out = await adminMarkRedemptionUsed({}, fd);
    setConfirmando(false);
    if (out?.error) {
      setErro(out.error);
      return;
    }
    setConfirmado(true);
    setRes({ ...res, status: "usado" });
  }

  function limpar() {
    setCodigo("");
    setRes(null);
    setErro(null);
    setConfirmado(false);
  }

  const podeUsar = res?.status === "ativo" && !res?.expirado && !confirmado;

  return (
    <div className="glass rounded-3xl p-5 shadow-glass">
      {/* Busca */}
      <label className="text-[12px] font-bold text-ink">Código do resgate</label>
      <div className="mt-1.5 flex gap-2">
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && validar()}
          placeholder="EM-XXXXX"
          className="flex-1 rounded-xl border border-line bg-white px-4 py-3 font-mono text-[16px] font-extrabold tracking-widest text-ink outline-none placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
        <button
          onClick={validar}
          disabled={loading}
          className="rounded-xl bg-ink px-5 py-3 text-[14px] font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : "Validar"}
        </button>
      </div>

      {erro && (
        <div className="mt-3 rounded-xl border border-red/20 bg-red/8 px-3 py-2.5 text-[13px] font-bold text-red">
          {erro}
        </div>
      )}

      {/* Resultado */}
      {res?.found && (
        <div className="mt-4 rounded-2xl border border-line p-4">
          <div className="text-[12px] font-semibold text-muted">Desconto a aplicar</div>
          <div className="mt-0.5 text-[30px] font-extrabold tracking-tight text-ink">
            {brl(res.valor ?? 0)}
          </div>
          <div className="mt-1 text-[13px] font-bold text-ink">{res.reward}</div>

          <div className="mt-3 space-y-1 text-[12.5px]">
            <Row k="Cliente" v={res.cliente ?? "—"} />
            <Row k="Custo" v={`${res.custo} pontos`} />
            <Row k="Válido até" v={dataCurta(res.expires_at)} />
          </div>

          {/* Estado */}
          {confirmado ? (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-center text-[14px] font-extrabold text-emerald-600">
              Uso confirmado ✓
            </div>
          ) : podeUsar ? (
            <button
              onClick={confirmarUso}
              disabled={confirmando}
              className="mt-4 w-full rounded-xl bg-blue py-3.5 text-[14px] font-extrabold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
            >
              {confirmando ? "Confirmando…" : "Confirmar uso"}
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-center text-[13px] font-bold text-amber-600">
              {res.expirado ? "Código expirado — não pode ser usado." : `Código ${res.status} — não pode ser usado.`}
            </div>
          )}

          <button
            onClick={limpar}
            className="mt-2 w-full rounded-xl border border-line bg-white py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
          >
            Validar outro
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold text-ink">{v}</span>
    </div>
  );
}

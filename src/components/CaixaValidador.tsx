"use client";

import { useEffect, useRef, useState } from "react";
import { caixaLookup, adminMarkRedemptionUsed, type CaixaResult } from "@/app/actions/admin";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataCurta(s: string | null | undefined) {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}
function hora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Beep curto via Web Audio API — sem depender de nenhum arquivo de áudio.
function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch {
    // Ambiente sem suporte a áudio — ignora silenciosamente.
  }
}

type HistItem = {
  codigo: string;
  cliente: string;
  valor: number;
  ok: boolean;
  hora: string;
};

export default function CaixaValidador() {
  const [codigo, setCodigo] = useState("");
  const [res, setRes] = useState<CaixaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Mantém o input sempre focado — o leitor Bemetec "digita" no campo ativo.
  useEffect(() => {
    inputRef.current?.focus();
  }, [res, erro]);

  async function validar() {
    if (!codigo.trim()) return;
    const lido = codigo;
    setCodigo(""); // limpa na hora — pronto pra receber a próxima leitura do scanner
    setLoading(true);
    setErro(null);
    setConfirmado(false);
    setRes(null);
    const r = await caixaLookup(lido);
    setLoading(false);
    if (!r.found) {
      beep(false);
      setErro(r.error ?? "Código não encontrado.");
      setHistorico((h) => [
        { codigo: lido.trim().toUpperCase(), cliente: "—", valor: 0, ok: false, hora: hora(new Date()) },
        ...h,
      ].slice(0, 10));
      return;
    }
    const podeUsar = r.status === "ativo" && !r.expirado;
    beep(podeUsar);
    setRes(r);
    setHistorico((h) => [
      { codigo: r.codigo ?? lido, cliente: r.cliente ?? "—", valor: r.valor ?? 0, ok: podeUsar, hora: hora(new Date()) },
      ...h,
    ].slice(0, 10));
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
      beep(false);
      setErro(out.error);
      return;
    }
    beep(true);
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
      <p className="mt-0.5 text-[11.5px] text-muted">Aponte o scanner aqui ou digite o código (ex: EM-7K9P2)</p>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && validar()}
          placeholder="EM-XXXXX"
          className="flex-1 rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-4 font-mono text-[20px] font-extrabold tracking-widest text-ink outline-none placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
        <button
          onClick={validar}
          disabled={loading}
          className="rounded-xl bg-ink px-5 py-3 text-[14px] font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : "Validar"}
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 py-6">
          <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-ink/10 border-t-blue" />
          <span className="text-[13px] font-semibold text-muted">Validando…</span>
        </div>
      )}

      {erro && !loading && (
        <div className="mt-4 rounded-2xl border-2 border-red/30 bg-red/8 px-4 py-5 text-center">
          <div className="text-[15px] font-extrabold text-red">✕ {erro}</div>
        </div>
      )}

      {/* Resultado */}
      {res?.found && !loading && (
        <div
          className={`mt-4 rounded-2xl border-2 p-5 text-center ${
            podeUsar || confirmado ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <div className="text-[13px] font-bold text-muted">{res.cliente ?? "—"}</div>
          <div
            className={`mt-1 text-[48px] font-extrabold leading-none tracking-tight ${
              podeUsar || confirmado ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {brl(res.valor ?? 0)}
          </div>
          <div className="mt-1.5 text-[13px] font-bold text-ink">{res.reward}</div>

          <div className="mt-3 space-y-1 text-left text-[12.5px]">
            <Row k="Custo" v={`${res.custo} pontos`} />
            <Row k="Válido até" v={dataCurta(res.expires_at)} />
          </div>

          {/* Estado */}
          {confirmado ? (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-center text-[15px] font-extrabold text-emerald-600">
              Uso confirmado ✓
            </div>
          ) : podeUsar ? (
            <button
              onClick={confirmarUso}
              disabled={confirmando}
              className="mt-4 w-full rounded-xl bg-blue py-4 text-[16px] font-extrabold text-white transition-colors hover:bg-blue-bright disabled:opacity-50"
            >
              {confirmando ? "Confirmando…" : "Confirmar uso"}
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-center text-[14px] font-extrabold text-amber-600">
              {res.expirado ? "Código expirado — não pode ser usado." : `Código ${res.status} — não pode ser usado.`}
            </div>
          )}
        </div>
      )}

      {(res?.found || erro) && !loading && (
        <button
          onClick={limpar}
          className="mt-3 w-full rounded-xl border border-line bg-white/50 dark:bg-transparent py-3 text-[13px] font-bold text-muted transition-colors hover:bg-ink/5"
        >
          Próximo cliente
        </button>
      )}

      {/* Histórico da sessão */}
      {historico.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-muted">
            Últimos lidos nesta sessão
          </div>
          <div className="space-y-1.5">
            {historico.map((h, i) => (
              <div
                key={`${h.codigo}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px]"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.ok ? "bg-emerald-500" : "bg-red"}`} />
                <span className="min-w-0 flex-1 truncate font-mono font-bold text-ink">{h.codigo}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{h.cliente}</span>
                <span className="shrink-0 font-semibold text-ink">{h.valor > 0 ? brl(h.valor) : "—"}</span>
                <span className="shrink-0 text-muted">{h.hora}</span>
              </div>
            ))}
          </div>
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

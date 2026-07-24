"use client";

import { useEffect, useState } from "react";
import { ativarPush, pushSuportado } from "@/lib/push";
import { Bell, Close } from "@/components/icons";

const DISMISS_KEY = "estelamaris:push-dismissed";

export default function PushOptIn({ userId }: { userId: string }) {
  const [mostrar, setMostrar] = useState(false);
  const [ativando, setAtivando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSuportado()) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setMostrar(true);
  }, []);

  async function ativar() {
    setAtivando(true);
    setErro(null);
    const r = await ativarPush(userId);
    setAtivando(false);
    if (!r.ok) {
      setErro(r.error ?? "Não foi possível ativar.");
      return;
    }
    setMostrar(false);
  }

  function dispensar() {
    localStorage.setItem(DISMISS_KEY, "1");
    setMostrar(false);
  }

  if (!mostrar) return null;

  return (
    <div className="glass mt-3.5 flex items-start gap-3 rounded-2xl p-3.5 shadow-soft">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red/10 text-red">
        <Bell width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-extrabold text-ink">Ativar notificações?</div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          Avisamos quando sua nota for aprovada, quando resgatar um desconto e quando subir de
          nível.
        </p>
        {erro && <p className="mt-1 text-[11.5px] font-bold text-red">{erro}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={ativar}
            disabled={ativando}
            className="rounded-lg bg-ink px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
          >
            {ativando ? "Ativando…" : "Ativar"}
          </button>
          <button
            onClick={dispensar}
            className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-muted hover:bg-ink/5"
          >
            Agora não
          </button>
        </div>
      </div>
      <button
        onClick={dispensar}
        aria-label="Fechar"
        className="shrink-0 text-muted hover:text-ink"
      >
        <Close width={16} height={16} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ativarPush, desativarPush, pushSuportado } from "@/lib/push";
import { Bell } from "@/components/icons";

type Status = "checando" | "sem-suporte" | "bloqueado" | "inativo" | "ativo";

export default function PushToggle({ userId }: { userId: string }) {
  const [status, setStatus] = useState<Status>("checando");
  const [ativando, setAtivando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function checar() {
      if (!pushSuportado()) {
        setStatus("sem-suporte");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("bloqueado");
        return;
      }
      if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setStatus(sub ? "ativo" : "inativo");
        return;
      }
      setStatus("inativo");
    }
    checar();
  }, []);

  async function ativar() {
    setAtivando(true);
    setErro(null);
    const r = await ativarPush(userId);
    setAtivando(false);
    if (!r.ok) {
      setErro(r.error ?? "Não foi possível ativar.");
      if (Notification.permission === "denied") setStatus("bloqueado");
      return;
    }
    setStatus("ativo");
  }

  async function desativar() {
    setDesativando(true);
    setErro(null);
    const r = await desativarPush(userId);
    setDesativando(false);
    if (!r.ok) {
      setErro(r.error ?? "Não foi possível desativar.");
      return;
    }
    setStatus("inativo");
  }

  if (status === "checando" || status === "sem-suporte") return null;

  return (
    <div className="glass mt-4 flex items-center gap-3 rounded-2xl p-4 shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red/10 text-red">
        <Bell width={19} height={19} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-extrabold text-ink">Notificações</div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          {status === "ativo"
            ? "Ativadas neste dispositivo."
            : status === "bloqueado"
              ? "Bloqueadas no navegador. Ative em Configurações do site."
              : "Avise quando a nota for aprovada e o resgate estiver pronto."}
        </p>
        {erro && <p className="mt-1 text-[11.5px] font-bold text-red">{erro}</p>}
      </div>
      {status === "inativo" && (
        <button
          onClick={ativar}
          disabled={ativando}
          className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {ativando ? "Ativando…" : "Ativar"}
        </button>
      )}
      {status === "ativo" && (
        <button
          onClick={desativar}
          disabled={desativando}
          className="shrink-0 rounded-xl border border-line bg-white/50 dark:bg-transparent px-3.5 py-2 text-[12.5px] font-bold text-muted transition-colors hover:bg-ink/5 disabled:opacity-50"
        >
          {desativando ? "Desativando…" : "Desativar"}
        </button>
      )}
    </div>
  );
}

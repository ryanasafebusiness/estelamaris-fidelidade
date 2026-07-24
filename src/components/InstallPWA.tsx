"use client";

import { useEffect, useState } from "react";
import { Download, ShareIos, Close } from "@/components/icons";

const DISMISS_KEY = "estelamaris:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function jaInstalado() {
  if (typeof window === "undefined") return true;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standalone);
}

function isIos() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarIos, setMostrarIos] = useState(false);

  useEffect(() => {
    if (jaInstalado() || localStorage.getItem(DISMISS_KEY)) return;

    if (isIos()) {
      setMostrarIos(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dispensar() {
    localStorage.setItem(DISMISS_KEY, "1");
    setPrompt(null);
    setMostrarIos(false);
  }

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  if (!prompt && !mostrarIos) return null;

  return (
    <div className="glass mt-3.5 flex items-start gap-3 rounded-2xl p-3.5 shadow-soft">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red/10 text-red">
        {mostrarIos ? <ShareIos /> : <Download />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-extrabold text-ink">Adicionar à tela de início</div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          {mostrarIos
            ? 'Toque em compartilhar e depois em "Adicionar à Tela de Início" pra abrir o Estelamaris como um app.'
            : "Instale o Estelamaris no seu celular pra acessar mais rápido, com tela cheia."}
        </p>
        {!mostrarIos && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={instalar}
              className="rounded-lg bg-ink px-3 py-1.5 text-[12px] font-bold text-white"
            >
              Instalar
            </button>
            <button
              onClick={dispensar}
              className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-muted hover:bg-ink/5"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
      <button onClick={dispensar} aria-label="Fechar" className="shrink-0 text-muted hover:text-ink">
        <Close width={16} height={16} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Splash de abertura do app: cobre a tela com a marca + spinner até a página
 * hidratar, depois some com um fade. Só aparece uma vez por carregamento
 * "duro" (recarregar/abrir o app), já que layout.tsx não remonta em
 * navegações internas — as trocas de página usam o loading.tsx global.
 */
export default function BootSpinner() {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setHiding(true), 350);
    const remove = setTimeout(() => setGone(true), 650);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-surface transition-opacity duration-300 ${
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Image src="/logo-mark.png" alt="" width={64} height={64} priority className="rounded-full shadow-red" />
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[3px] border-line opacity-30" />
        <div className="absolute inset-0 rounded-full border-[3px] border-red border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

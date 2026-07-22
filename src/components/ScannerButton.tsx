"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Camera } from "@/components/icons";

// Carrega o Scanner de forma assíncrona para não pesar o bundle inicial da página
const ScannerModal = dynamic(() => import("@/components/ScannerModal"), { ssr: false });

export default function ScannerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ler QR Code"
        className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h3M17 4h3v3M4 17v3h3M17 20h3v-3M9 9h6v6H9z" />
        </svg>
      </button>

      {open && <ScannerModal onClose={() => setOpen(false)} />}
    </>
  );
}

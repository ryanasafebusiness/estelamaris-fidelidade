"use client";

import { useState } from "react";
import Link from "next/link";
import { Close, StarSolid, SwapVert, Backspace } from "@/components/icons";
import { perfil, RESGATE, fmtPts, fmtBRL } from "@/lib/mock";

const SALDO = perfil.saldo;

export default function ResgatarPage() {
  const [pts, setPts] = useState("480");

  const n = Math.min(parseInt(pts || "0", 10) || 0, SALDO);
  const brl = n * RESGATE.reaisPorPonto;

  function press(k: string) {
    setPts((prev) => {
      if (k === "del") return prev.slice(0, -1);
      let next = prev === "0" ? "" : prev;
      if (next.length >= 6) return next;
      next += k;
      // limita ao saldo
      if ((parseInt(next, 10) || 0) > SALDO) return String(SALDO);
      return next;
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-5">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <Link
          href="/"
          aria-label="Fechar"
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
        >
          <Close />
        </Link>
        <div className="text-center">
          <div className="text-[16px] font-extrabold tracking-tight">Resgatar desconto</div>
          <div className="mt-px text-[11px] font-semibold text-muted">Sem taxa</div>
        </div>
        <span className="w-[38px]" />
      </header>

      {/* Taxa */}
      <div className="mt-3 flex justify-center">
        <span className="rounded-full bg-ink px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide text-white">
          100 pontos = R$ 5,00
        </span>
      </div>

      {/* Conversor */}
      <section className="relative mt-3 flex flex-col gap-2.5">
        <div className="glass flex items-center justify-between rounded-[22px] px-4 py-4 shadow-soft">
          <div>
            <div className="text-[30px] font-extrabold tracking-tight">{fmtPts(n)}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-muted">
              Saldo: {fmtPts(SALDO)} pontos
            </div>
          </div>
          <Tag color="red" label="Pontos">
            <StarSolid width={12} height={12} className="text-white" />
          </Tag>
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-glass">
          <SwapVert />
        </div>

        <div className="glass flex items-center justify-between rounded-[22px] px-4 py-4 shadow-soft">
          <div>
            <div
              className={`text-[30px] font-extrabold tracking-tight ${n === 0 ? "text-muted" : ""}`}
            >
              {fmtBRL(brl)}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-muted">Vira desconto no caixa</div>
          </div>
          <Tag color="blue" label="Desconto">
            <span className="text-[11px] font-extrabold text-white">R$</span>
          </Tag>
        </div>
      </section>

      {/* Teclado */}
      <section className="mt-4 grid grid-cols-3 gap-1">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <Key key={k} onClick={() => press(k)}>
            {k}
          </Key>
        ))}
        <Key onClick={() => {}} aria-label="ponto" />
        <Key onClick={() => press("0")}>0</Key>
        <Key onClick={() => press("del")} aria-label="Apagar">
          <Backspace />
        </Key>
      </section>

      <button className="mt-2 rounded-[22px] bg-gradient-to-b from-red to-red-deep px-4 py-4 text-[15px] font-extrabold tracking-wide text-white shadow-red active:translate-y-px">
        Continuar
      </button>
    </main>
  );
}

function Tag({
  children,
  color,
  label,
}: {
  children: React.ReactNode;
  color: "red" | "blue";
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-2.5 py-2 text-[13px] font-extrabold shadow-soft">
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full ${
          color === "red" ? "bg-red" : "bg-blue"
        }`}
      >
        {children}
      </span>
      {label}
    </div>
  );
}

function Key({
  children,
  onClick,
  ...rest
}: {
  children?: React.ReactNode;
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-2xl py-3 text-[23px] font-bold text-ink transition-colors hover:bg-ink/5 active:bg-ink/10"
      {...rest}
    >
      {children}
    </button>
  );
}

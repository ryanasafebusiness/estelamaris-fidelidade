"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { NavHome, NavStar, Swap, NavDoc } from "./icons";

type Active = "home" | "recompensas" | "meus-resgates" | "historico";

const items: { key: Active; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "home", href: "/", label: "Início", icon: <NavHome /> },
  { key: "recompensas", href: "/recompensas", label: "Recompensas", icon: <NavStar /> },
  {
    key: "meus-resgates",
    href: "/meus-resgates",
    label: "Meus Cupons",
    icon: <Swap width={21} height={21} />,
  },
  { key: "historico", href: "/historico", label: "Histórico", icon: <NavDoc /> },
];

export default function BottomNav({ current = "home" }: { current?: Active }) {
  return (
    <>
      {/* Spacer para o conteúdo não ficar escondido atrás do menu flutuante */}
      <div className="h-24 shrink-0" />

      {/* Container fixo flutuante */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[420px] px-4 pb-5">
        <nav className="glass flex items-center justify-between rounded-full border border-line/60 px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {items.map((it) => {
            const isActive = current === it.key;
            return (
              <Link
                key={it.key}
                href={it.href}
                aria-label={it.label}
                className="relative flex h-11 w-11 items-center justify-center rounded-full"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-muted"
                  }`}
                >
                  {it.icon}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

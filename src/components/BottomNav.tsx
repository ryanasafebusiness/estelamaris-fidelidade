import Link from "next/link";
import { NavHome, NavStar, Swap, NavDoc } from "./icons";

type Active = "home" | "recompensas" | "meus-resgates" | "historico";

const item = "flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors";
const active = "bg-ink text-white";

export default function BottomNav({ current = "home" }: { current?: Active }) {
  return (
    <>
      {/* Spacer para o conteúdo não ficar escondido atrás do menu flutuante */}
      <div className="h-24 shrink-0" />

      {/* Container fixo flutuante */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[420px] px-4 pb-5">
        <nav className="glass flex items-center justify-between rounded-full border border-line/60 px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <Link href="/" aria-label="Início" className={`${item} ${current === "home" ? active : ""}`}>
            <NavHome />
          </Link>
          <Link
            href="/recompensas"
            aria-label="Recompensas"
            className={`${item} ${current === "recompensas" ? active : ""}`}
          >
            <NavStar />
          </Link>
          <Link
            href="/meus-resgates"
            aria-label="Meus Cupons"
            className={`${item} ${current === "meus-resgates" ? active : ""}`}
          >
            <Swap width={21} height={21} />
          </Link>
          <Link
            href="/historico"
            aria-label="Histórico"
            className={`${item} ${current === "historico" ? active : ""}`}
          >
            <NavDoc />
          </Link>
        </nav>
      </div>
    </>
  );
}

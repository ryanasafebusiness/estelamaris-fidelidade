import Link from "next/link";
import { NavHome, NavStar, Swap, NavDoc } from "./icons";

type Active = "home" | "recompensas" | "resgatar" | "historico";

const item = "flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors";
const active = "bg-ink text-white";

export default function BottomNav({ current = "home" }: { current?: Active }) {
  return (
    <nav className="mt-auto flex items-center justify-between px-8 pb-4 pt-3">
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
        href="/resgatar"
        aria-label="Resgatar"
        className={`${item} ${current === "resgatar" ? active : ""}`}
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
  );
}

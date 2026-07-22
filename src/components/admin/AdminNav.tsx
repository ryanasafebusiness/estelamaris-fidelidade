"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

const s = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Dash(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...s} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function Receipt(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...s} {...p}>
      <path d="M7 8h8M7 12h6M6 20V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15l-2.3-1.5L13 20l-2.7-1.5L8 20 6 20Z" />
    </svg>
  );
}
function Gift(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...s} {...p}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8V21M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7M12 8c-2-3-6-3-6 0M12 8c2-3 6-3 6 0" />
    </svg>
  );
}
function Ticket(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...s} {...p}>
      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 9v12h20V9M9 3v18" />
    </svg>
  );
}

const items = [
  { href: "/admin", label: "Dashboard", Icon: Dash },
  { href: "/admin/notas", label: "Notas", Icon: Receipt },
  { href: "/admin/catalogo", label: "Catálogo", Icon: Gift },
  { href: "/admin/resgates", label: "Resgates", Icon: Ticket },
];

export default function AdminNav({ variant }: { variant: "side" | "top" }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (variant === "top") {
    return (
      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
              active(href) ? "bg-ink text-white" : "text-muted hover:bg-ink/5"
            }`}
          >
            <Icon width={16} height={16} />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition-colors ${
            active(href) ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink"
          }`}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}

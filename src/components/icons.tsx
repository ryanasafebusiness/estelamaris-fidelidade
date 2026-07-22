/**
 * Ícones do Estelamaris (extraídos do mockup aprovado).
 * `stroke` usa currentColor; a estrela usa gradiente vermelho→azul próprio.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function User(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" {...stroke} {...p}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}

export function Gear(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}

/** Estrela da marca com gradiente próprio (id único opcional). */
export function StarBrand({ gradId = "starGrad", ...p }: P & { gradId?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" {...p}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E11D2E" />
          <stop offset="100%" stopColor="#1E3FA6" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c.9 5.4 3.6 8.1 9 9-5.4.9-8.1 3.6-9 9-.9-5.4-3.6-8.1-9-9 5.4-.9 8.1-3.6 9-9Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

/** Estrela sólida (usa currentColor) — para pílula de nível e feed. */
export function StarSolid(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...p}>
      <path
        d="M12 2c.7 4 2.6 5.9 6.6 6.6C14.6 9.3 12.7 11.2 12 15c-.7-3.8-2.6-5.7-6.6-6.4C9.4 7.9 11.3 6 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ArrowUp(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...stroke} strokeWidth={2} {...p}>
      <path d="M12 20V8M6 14l6-6 6 6" />
    </svg>
  );
}

export function Plus(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} strokeWidth={2.2} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Camera(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...stroke} {...p}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1l1-2h7l1 2h1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

/** Setas de troca (resgatar). */
export function Swap(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" {...stroke} {...p}>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}

export function SwapVert(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} strokeWidth={2} {...p}>
      <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0 3 3m-3-3-3 3" />
    </svg>
  );
}

export function History(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...stroke} {...p}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6M6 3v4h4" />
    </svg>
  );
}

export function Dots(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" {...p}>
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  );
}

export function Receipt(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...p}>
      <path d="M7 8h8M7 12h6M6 20V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15l-2.3-1.5L13 20l-2.7-1.5L8 20 6 20Z" />
    </svg>
  );
}

export function Close(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" {...stroke} strokeWidth={2} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function Backspace(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...stroke} {...p}>
      <path d="M20 6H9l-5 6 5 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1ZM17 9l-4 4M13 9l4 4" />
    </svg>
  );
}

/* --- ícones da navegação inferior --- */
export function NavHome(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" {...stroke} {...p}>
      <path d="M4 11 12 4l8 7M6 10v9h12v-9" />
    </svg>
  );
}
export function NavStar(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" {...stroke} {...p}>
      <path d="M12 3l2 4 4 .6-3 3 .7 4.4-3.7-2-3.7 2 .7-4.4-3-3 4-.6 2-4Z" />
    </svg>
  );
}
export function NavDoc(p: P) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" {...stroke} {...p}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  );
}

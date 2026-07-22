/** Máscaras e validações de formato (pt-BR). CPF: só formato, sem dígito verificador. */

export function soDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

/** 12345678901 → 123.456.789-01 (progressivo enquanto digita). */
export function mascaraCPF(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** (11) 98765-4321 — aceita fixo (10) e celular (11). */
export function mascaraTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function cpfCompleto(v: string): boolean {
  return soDigitos(v).length === 11;
}

export function telefoneCompleto(v: string): boolean {
  const n = soDigitos(v).length;
  return n === 10 || n === 11;
}

export function emailValido(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

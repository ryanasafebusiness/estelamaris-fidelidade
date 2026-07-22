/**
 * Dados de exemplo (PLACEHOLDER) para montar as telas.
 * ⚠️ Serão substituídos por consultas ao Supabase (profiles, points_ledger,
 * receipts) quando entrar a autenticação. Não usar em produção.
 */

export const perfil = {
  nome: "Ana",
  nivel: "Prata" as "Bronze" | "Prata" | "Ouro",
  esteMes: 320,
  saldo: 1240,
};

/** Taxa de conversão (espelha config.pontos_por_real / desconto). */
export const RESGATE = {
  pontosPorReal: 20, // 100 pontos = R$ 5,00  →  R$ 1,00 = 20 pontos
  reaisPorPonto: 0.05,
};

export type Movimento = {
  id: string;
  tipo: "credito" | "debito";
  titulo: string;
  sub: string;
  pontos: number; // assinado
};

export const atividade: Movimento[] = [
  { id: "1", tipo: "credito", titulo: "Nota aprovada", sub: "Hoje · 16:35 · R$ 128,00", pontos: 64 },
  { id: "2", tipo: "debito", titulo: "Resgate · R$ 12 de desconto", sub: "Ontem · 10:12", pontos: -240 },
  { id: "3", tipo: "credito", titulo: "Nota aprovada", sub: "22 jul · R$ 90,00", pontos: 45 },
  { id: "4", tipo: "credito", titulo: "Bônus de aniversário", sub: "20 jul · presente 🎉", pontos: 100 },
];

/** Formata inteiro de pontos em pt-BR (1240 → "1.240"). */
export function fmtPts(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** Formata reais sem símbolo (24 → "24,00"). */
export function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

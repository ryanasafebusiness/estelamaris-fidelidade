import type { Metadata } from "next";
import NotasCaixaClient from "./NotasCaixaClient";

export const metadata: Metadata = {
  title: "Estelamaris — Conferência de Notas",
  description: "Aprovação de notas enviadas por clientes.",
};

export default function CaixaNotasPage() {
  return <NotasCaixaClient />;
}

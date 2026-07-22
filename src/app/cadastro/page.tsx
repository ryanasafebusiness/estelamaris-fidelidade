import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import CadastroForm from "@/components/auth/CadastroForm";

export default function CadastroPage() {
  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Leva menos de um minuto. Comece a juntar pontos hoje."
      rodape={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-extrabold text-blue">
            Entrar
          </Link>
        </>
      }
    >
      <CadastroForm />
    </AuthShell>
  );
}

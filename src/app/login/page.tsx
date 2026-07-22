import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      titulo="Bem-vindo de volta"
      subtitulo="Entre para ver seus pontos e resgatar descontos."
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-extrabold text-blue">
            Cadastre-se
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}

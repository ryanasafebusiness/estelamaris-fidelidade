import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/auth/AuthShell";
import CompletarPerfilForm from "@/components/auth/CompletarPerfilForm";

export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verifica se já tem CPF
  const { data: profile } = await supabase
    .from("profiles")
    .select("cpf")
    .eq("id", user.id)
    .single();

  if (profile?.cpf) {
    // Se já tem, não precisa completar
    redirect("/");
  }

  return (
    <AuthShell
      titulo="Quase lá!"
      subtitulo="Como você entrou com o Google, precisamos apenas do seu CPF e Celular para o programa de fidelidade."
    >
      <CompletarPerfilForm userId={user.id} />
    </AuthShell>
  );
}

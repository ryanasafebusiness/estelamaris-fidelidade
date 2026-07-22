import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CaixaValidador from "@/components/CaixaValidador";

export const metadata: Metadata = {
  title: "Estelamaris — Caixa",
  description: "Validação de códigos de resgate no caixa.",
};

export default async function CaixaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();
  if (!profile || profile.papel !== "admin") redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-4 pb-8">
      <header className="flex items-center justify-between pt-5">
        <div>
          <div className="text-[18px] font-extrabold tracking-tight text-ink">Caixa</div>
          <div className="text-[12px] font-semibold text-muted">Validação de resgates</div>
        </div>
        <Link href="/admin" className="text-[12px] font-bold text-blue">
          ← Admin
        </Link>
      </header>

      <div className="mt-6">
        <CaixaValidador />
      </div>

      <p className="mt-5 px-2 text-center text-[12px] leading-relaxed text-muted">
        Digite ou escaneie o código do cliente, confira o valor do desconto, aplique-o no PDV e
        clique em <b className="text-ink">Confirmar uso</b>. Cada código só pode ser usado uma vez.
      </p>
    </main>
  );
}

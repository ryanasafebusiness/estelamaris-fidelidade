import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RedeemClient from "./RedeemClient";

export default async function ResgatarPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const upperCode = codigo.toUpperCase();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se não estiver logado, redireciona para login e volta pra cá depois
  if (!user) {
    redirect(`/login?next=/resgatar/${upperCode}`);
  }

  // Verifica se o voucher existe e os pontos (Apenas consulta, o resgate real é no Client via Action)
  const { data: voucher, error } = await supabase
    .from("point_vouchers")
    .select("pontos, status")
    .eq("codigo", upperCode)
    .single();

  if (error || !voucher) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-extrabold text-ink mb-2">Cupom Inválido</h1>
        <p className="text-muted text-sm">Este código não existe ou já foi resgatado.</p>
      </div>
    );
  }

  if (voucher.status !== "ativo") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-extrabold text-ink mb-2">Cupom Já Utilizado</h1>
        <p className="text-muted text-sm">Os pontos deste cupom já foram creditados em uma conta.</p>
      </div>
    );
  }

  return <RedeemClient codigo={upperCode} pontos={voucher.pontos} />;
}

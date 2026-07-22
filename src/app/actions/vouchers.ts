"use server";

import { createClient } from "@/lib/supabase/server";

function generateVoucherCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "EM-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generatePointVoucher(pontos: number) {
  if (pontos <= 0) {
    return { error: "A quantidade de pontos deve ser maior que zero." };
  }

  const supabase = await createClient();
  
  // Verifica se é admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado." };
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();
    
  if (profile?.papel !== "admin") return { error: "Apenas administradores podem gerar vouchers." };

  const codigo = generateVoucherCode();

  const { error } = await supabase
    .from("point_vouchers")
    .insert({
      codigo,
      pontos,
      status: "ativo"
    });

  if (error) {
    console.error("Erro ao gerar voucher:", error);
    return { error: "Erro interno ao gerar voucher." };
  }

  return { codigo };
}

export async function redeemPointVoucher(codigo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado para resgatar." };
  }

  // Chama a RPC para resgatar o voucher de forma atômica
  const { error } = await supabase.rpc("redeem_point_voucher", { p_codigo: codigo.toUpperCase() });

  if (error) {
    console.error("Erro no resgate:", error);
    if (error.message.includes("já foi utilizado") || error.message.includes("não encontrado")) {
       return { error: "Este código QR já foi resgatado ou é inválido." };
    }
    return { error: "Erro ao tentar resgatar os pontos. Tente novamente." };
  }

  return { success: true };
}

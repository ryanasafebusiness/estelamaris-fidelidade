"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminFormState = { error?: string; ok?: boolean; message?: string };

// ────────────────────────────────────────────────────────────────────
// Helper: verifica se o usuário logado é admin. Aborta se não for.
// ────────────────────────────────────────────────────────────────────
async function requireAdmin() {
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

  return user;
}

// ────────────────────────────────────────────────────────────────────
// NOTAS — aprovar manualmente
// ────────────────────────────────────────────────────────────────────
export async function adminApproveReceipt(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const receiptId = String(formData.get("receipt_id") ?? "");
  const valor = parseFloat(String(formData.get("valor") ?? "0"));

  if (!receiptId) return { error: "ID da nota inválido." };
  if (valor <= 0) return { error: "Informe um valor válido." };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("credit_receipt", {
    p_receipt: receiptId,
    p_valor: valor,
    p_data: null,
    p_estab: "Aprovação manual (admin)",
    p_cnpj: null,
    p_chave: null,
    p_hash: null,
    p_ai: { source: "admin_manual" },
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/notas");
  const result = data as { creditado?: boolean; pontos?: number; motivo?: string };
  if (result?.creditado) {
    return { ok: true, message: `Nota aprovada! ${result.pontos} pontos creditados.` };
  }
  return { error: result?.motivo || "Não foi possível aprovar." };
}

// ────────────────────────────────────────────────────────────────────
// NOTAS — rejeitar manualmente
// ────────────────────────────────────────────────────────────────────
export async function adminRejectReceipt(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const receiptId = String(formData.get("receipt_id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!receiptId) return { error: "ID da nota inválido." };

  const admin = createAdminClient();
  const { error } = await admin.rpc("reject_receipt", {
    p_receipt: receiptId,
    p_motivo: motivo || "Rejeitada pelo administrador",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/notas");
  return { ok: true, message: "Nota rejeitada." };
}

// ────────────────────────────────────────────────────────────────────
// CONFIG — atualizar parâmetros
// ────────────────────────────────────────────────────────────────────
export async function adminUpdateConfig(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const fields = {
    pontos_por_real: parseFloat(String(formData.get("pontos_por_real") ?? "1")),
    mult_bronze: parseFloat(String(formData.get("mult_bronze") ?? "1")),
    mult_prata: parseFloat(String(formData.get("mult_prata") ?? "1.2")),
    mult_ouro: parseFloat(String(formData.get("mult_ouro") ?? "1.5")),
    limite_prata: parseInt(String(formData.get("limite_prata") ?? "500"), 10),
    limite_ouro: parseInt(String(formData.get("limite_ouro") ?? "2000"), 10),
    dias_expiracao_resgate: parseInt(String(formData.get("dias_expiracao_resgate") ?? "30"), 10),
  };

  const admin = createAdminClient();
  const { error } = await admin.from("config").update(fields).eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  return { ok: true, message: "Configurações atualizadas." };
}

// ────────────────────────────────────────────────────────────────────
// REWARDS — criar
// ────────────────────────────────────────────────────────────────────
export async function adminCreateReward(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const custo = parseInt(String(formData.get("custo_pontos") ?? "0"), 10);
  const valorReais = parseFloat(String(formData.get("valor_reais") ?? "0")) || 0;

  if (!titulo) return { error: "Informe o título." };
  if (custo <= 0) return { error: "Custo deve ser maior que zero." };

  const admin = createAdminClient();
  const { error } = await admin.from("rewards").insert({
    titulo,
    descricao: descricao || null,
    custo_pontos: custo,
    valor_reais: valorReais,
    ativo: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  return { ok: true, message: `Recompensa "${titulo}" criada.` };
}

// ────────────────────────────────────────────────────────────────────
// REWARDS — atualizar
// ────────────────────────────────────────────────────────────────────
export async function adminUpdateReward(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const custo = parseInt(String(formData.get("custo_pontos") ?? "0"), 10);
  const valorReais = parseFloat(String(formData.get("valor_reais") ?? "0")) || 0;

  if (!id) return { error: "ID inválido." };
  if (!titulo) return { error: "Informe o título." };
  if (custo <= 0) return { error: "Custo deve ser maior que zero." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("rewards")
    .update({ titulo, descricao: descricao || null, custo_pontos: custo, valor_reais: valorReais })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  return { ok: true, message: "Recompensa atualizada." };
}

// ────────────────────────────────────────────────────────────────────
// REWARDS — ativar/desativar
// ────────────────────────────────────────────────────────────────────
export async function adminToggleReward(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";

  if (!id) return { error: "ID inválido." };

  const admin = createAdminClient();
  const { error } = await admin.from("rewards").update({ ativo: !ativo }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/catalogo");
  return { ok: true, message: ativo ? "Recompensa desativada." : "Recompensa ativada." };
}

// ────────────────────────────────────────────────────────────────────
// RESGATES — marcar como usado (baixa no caixa)
// ────────────────────────────────────────────────────────────────────
export async function adminMarkRedemptionUsed(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  if (!codigo) return { error: "Informe o código." };

  const admin = createAdminClient();

  const { data: redemption, error: findErr } = await admin
    .from("redemptions")
    .select("id, status")
    .eq("codigo", codigo)
    .single();

  if (findErr || !redemption) return { error: "Código não encontrado." };
  if (redemption.status !== "ativo")
    return { error: `Este código já está "${redemption.status}".` };

  const { error } = await admin
    .from("redemptions")
    .update({ status: "usado", used_at: new Date().toISOString() })
    .eq("id", redemption.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/resgates");
  return { ok: true, message: `Código ${codigo} marcado como usado.` };
}

// ────────────────────────────────────────────────────────────────────
// DASHBOARD — métricas
// ────────────────────────────────────────────────────────────────────
export type DashboardMetrics = {
  clientes_total: number;
  clientes_ativos: number;
  notas_aprovadas: number;
  notas_pendentes: number;
  notas_rejeitadas: number;
  notas_hoje: number;
  faturamento_total: number;
  faturamento_mes: number;
  ticket_medio: number;
  pontos_creditados: number;
  pontos_resgatados: number;
  pontos_em_circulacao: number;
  resgates_ativos: number;
  resgates_usados: number;
  custo_descontos: number;
  custo_descontos_pendente: number;
  notas_por_dia: { dia: string; count: number }[];
};

export async function adminGetDashboardMetrics(): Promise<DashboardMetrics> {
  await requireAdmin();
  // admin_metrics() usa is_admin() (auth.uid()) -> chamamos pelo client de sessão.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_metrics");
  if (error) throw new Error(error.message);
  return data as DashboardMetrics;
}

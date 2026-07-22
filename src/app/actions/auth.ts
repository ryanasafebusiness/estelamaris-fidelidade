"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  mascaraCPF,
  mascaraTelefone,
  cpfCompleto,
  telefoneCompleto,
  emailValido,
} from "@/lib/validators";

export type FormState = { error?: string; ok?: boolean; message?: string };

/** Traduz erros do Supabase Auth para um tom pt-BR claro. */
function traduzErroAuth(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar — verifique sua caixa de entrada.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um instante e tente de novo.";
  if (m.includes("password")) return "Senha inválida. Use ao menos 6 caracteres.";
  return "Não foi possível concluir agora. Tente novamente.";
}

// ---------------------------------------------------------------- LOGIN
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!emailValido(email)) return { error: "Digite um e-mail válido." };
  if (!senha) return { error: "Digite sua senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { error: traduzErroAuth(error.message) };

  const next = String(formData.get("next") ?? "") || "/";
  redirect(next.startsWith("/") ? next : "/");
}

// ---------------------------------------------------------------- CADASTRO
export async function cadastrar(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const cpfInput = String(formData.get("cpf") ?? "");
  const telInput = String(formData.get("telefone") ?? "");

  if (nome.length < 2) return { error: "Informe seu nome." };
  if (!cpfCompleto(cpfInput)) return { error: "CPF incompleto. Use o formato 000.000.000-00." };
  if (!telefoneCompleto(telInput)) return { error: "Telefone incompleto. Inclua o DDD." };
  if (!emailValido(email)) return { error: "Digite um e-mail válido." };
  if (senha.length < 6) return { error: "A senha precisa de pelo menos 6 caracteres." };

  const cpf = mascaraCPF(cpfInput); // normaliza para 000.000.000-00
  const telefone = mascaraTelefone(telInput);

  const supabase = await createClient();

  // Pré-checagem amigável de CPF (evita conta órfã por conflito no trigger).
  const { data: disponivel, error: rpcErro } = await supabase.rpc("cpf_disponivel", {
    p_cpf: cpf,
  });
  if (rpcErro) return { error: "Não consegui validar o CPF agora. Tente de novo." };
  if (disponivel === false) return { error: "Esse CPF já está cadastrado." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, cpf, telefone },
      emailRedirectTo: `${siteUrl}/login`,
    },
  });
  if (error) return { error: traduzErroAuth(error.message) };

  // Confirmação de e-mail desligada → já vem sessão: entra direto.
  if (data.session) redirect("/");

  // Confirmação ligada → sem sessão ainda.
  return {
    ok: true,
    message: "Conta criada! Enviamos um e-mail de confirmação para ativar seu acesso.",
  };
}

// ---------------------------------------------------------------- PERFIL
export async function atualizarPerfil(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telInput = String(formData.get("telefone") ?? "");

  if (nome.length < 2) return { error: "Informe seu nome." };
  if (!telefoneCompleto(telInput)) return { error: "Telefone incompleto. Inclua o DDD." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ nome, telefone: mascaraTelefone(telInput) })
    .eq("id", user.id);

  if (error) return { error: "Não consegui salvar suas alterações. Tente de novo." };

  revalidatePath("/perfil");
  return { ok: true, message: "Perfil atualizado com sucesso." };
}

// ---------------------------------------------------------------- LOGOUT
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

// ---------------------------------------------------------------- COMPLETAR PERFIL
export async function completarPerfil(_prev: FormState, formData: FormData): Promise<FormState> {
  const cpfBruto = String(formData.get("cpf") ?? "");
  const telBruto = String(formData.get("telefone") ?? "");

  const cpf = cpfBruto.replace(/\D/g, "");
  const celular = telBruto.replace(/\D/g, "");

  if (!cpfCompleto(cpfBruto)) return { error: "Preencha o CPF completo." };
  if (!telefoneCompleto(telBruto)) return { error: "Preencha o telefone com DDD." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Usuário não autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ cpf, telefone: mascaraTelefone(telBruto) })
    .eq("id", user.id);

  if (error) {
    console.error("Erro ao salvar perfil:", error);
    if (error.message.includes("profiles_cpf_key")) {
      return { error: "Este CPF já está cadastrado em outra conta." };
    }
    return { error: "Não foi possível salvar os dados. Tente novamente." };
  }

  redirect("/");
}

// ---------------------------------------------------------------- PROTEÇÃO DE ROTAS
export async function requireAuthAndProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.cpf) {
    redirect("/completar-perfil");
  }

  return { user, profile };
}

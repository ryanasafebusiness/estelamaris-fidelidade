"use client";

import { useActionState, useState } from "react";
import { cadastrar, type FormState } from "@/app/actions/auth";
import { mascaraCPF, mascaraTelefone } from "@/lib/validators";
import { Field, Aviso, SubmitButton } from "./ui";

export default function CadastroForm() {
  const [state, action] = useActionState<FormState, FormData>(cadastrar, {});
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  // Sucesso com confirmação de e-mail: mostra só o aviso.
  if (state?.ok) {
    return <Aviso message={state.message} />;
  }

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Aviso error={state?.error} />
      <Field label="Nome" name="nome" autoComplete="name" placeholder="Seu nome" required />
      <Field
        label="CPF"
        name="cpf"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(mascaraCPF(e.target.value))}
        maxLength={14}
        required
      />
      <Field
        label="Telefone"
        name="telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 98765-4321"
        value={telefone}
        onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
        maxLength={16}
        required
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="voce@email.com"
        required
      />
      <Field
        label="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        placeholder="mínimo 6 caracteres"
        minLength={6}
        required
      />
      <div className="mt-1">
        <SubmitButton>Criar conta</SubmitButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { atualizarPerfil, type FormState } from "@/app/actions/auth";
import { mascaraTelefone } from "@/lib/validators";
import { Field, Aviso, SubmitButton } from "./ui";

export default function PerfilForm({
  nome,
  telefone,
  email,
  cpf,
}: {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(atualizarPerfil, {});
  const [tel, setTel] = useState(telefone);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Aviso error={state?.error} message={state?.message} />

      <Field label="Nome" name="nome" defaultValue={nome} autoComplete="name" required />
      <Field
        label="Telefone"
        name="telefone"
        type="tel"
        inputMode="tel"
        value={tel}
        onChange={(e) => setTel(mascaraTelefone(e.target.value))}
        maxLength={16}
        required
      />

      <Field label="E-mail" value={email} readOnly disabled hint="O e-mail não pode ser alterado." />
      <Field label="CPF" value={cpf || "—"} readOnly disabled hint="O CPF não pode ser alterado." />

      <div className="mt-1">
        <SubmitButton>Salvar alterações</SubmitButton>
      </div>
    </form>
  );
}

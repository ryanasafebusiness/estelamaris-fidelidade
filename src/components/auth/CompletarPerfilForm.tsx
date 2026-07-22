"use client";

import { useActionState, useState } from "react";
import { completarPerfil, type FormState } from "@/app/actions/auth";
import { mascaraCPF, mascaraTelefone } from "@/lib/validators";
import { Field, Aviso, SubmitButton } from "./ui";

export default function CompletarPerfilForm({ userId }: { userId: string }) {
  const [state, action] = useActionState<FormState, FormData>(completarPerfil, {});
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Aviso error={state?.error} />
      <input type="hidden" name="userId" value={userId} />
      
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
        label="Celular / WhatsApp"
        name="telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 98765-4321"
        value={telefone}
        onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
        maxLength={15}
        required
      />
      
      <div className="mt-2">
        <SubmitButton>Salvar e continuar</SubmitButton>
      </div>
    </form>
  );
}

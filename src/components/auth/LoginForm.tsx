"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/auth";
import { Field, Aviso, SubmitButton } from "./ui";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-3.5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Aviso error={state?.error} />
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
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />
      <div className="mt-1">
        <SubmitButton>Entrar</SubmitButton>
      </div>
    </form>
  );
}

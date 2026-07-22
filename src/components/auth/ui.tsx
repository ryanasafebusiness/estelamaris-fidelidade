"use client";

import { useFormStatus } from "react-dom";

/** Campo de formulário rotulado, mobile-first, no tema. */
export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold text-ink">{label}</span>
      <input
        className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-[15px] font-semibold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
        {...props}
      />
      {hint ? <span className="mt-1 block text-[11px] font-semibold text-muted">{hint}</span> : null}
    </label>
  );
}

/** Banner de erro (vermelho) ou sucesso (azul). */
export function Aviso({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red/20 bg-red/8 px-4 py-3 text-[13px] font-bold text-red">
        {error}
      </div>
    );
  }
  if (message) {
    return (
      <div className="rounded-2xl border border-blue/20 bg-blue/8 px-4 py-3 text-[13px] font-bold text-blue">
        {message}
      </div>
    );
  }
  return null;
}

/** Botão primário (vermelho) com estado de envio. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-gradient-to-b from-red to-red-deep px-4 py-3.5 text-[15px] font-extrabold tracking-wide text-white shadow-red transition active:translate-y-px disabled:opacity-60"
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}

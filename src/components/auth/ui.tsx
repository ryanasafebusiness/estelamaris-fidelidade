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

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function GoogleButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-[15px] font-extrabold tracking-wide text-ink shadow-soft transition active:translate-y-px disabled:opacity-60 border border-line"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? "Aguarde..." : "Continuar com Google"}
    </button>
  );
}

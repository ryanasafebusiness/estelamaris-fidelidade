/**
 * Supabase client para o BROWSER (Client Components).
 *
 * Usa apenas a ANON/PUBLISHABLE key. Sujeito a RLS.
 * O cliente NUNCA escreve pontos nem status de nota por aqui — RLS bloqueia.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

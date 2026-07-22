/**
 * Supabase client ADMIN — service role. IGNORA RLS.
 *
 * ⚠️ SEGURANÇA (regra inegociável do projeto):
 *  - A `import "server-only"` acima garante ERRO DE BUILD se este arquivo
 *    for importado em qualquer código que vá para o bundle do browser.
 *  - A SUPABASE_SERVICE_ROLE_KEY só pode existir no n8n e em rotas de servidor.
 *    NUNCA no client, NUNCA no repositório.
 *  - Use este client apenas em Route Handlers / Server Actions confiáveis, e
 *    de preferência chamando funções SECURITY DEFINER (crédito/débito de pontos).
 */
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

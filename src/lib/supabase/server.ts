/**
 * Supabase client para o SERVIDOR (Server Components, Route Handlers, Server Actions).
 *
 * Usa a ANON/PUBLISHABLE key + cookies da sessão do usuário. Continua sujeito a RLS,
 * ou seja, respeita a identidade do usuário logado. NÃO use este client para creditar
 * pontos — para operações privilegiadas use `admin.ts` (service role) em rota de servidor.
 *
 * Em Next.js 16, `cookies()` é assíncrono, então esta factory é async.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de dentro de um Server Component (sem acesso de escrita a cookies).
            // Seguro ignorar se o refresh de sessão acontece em middleware.
          }
        },
      },
    },
  );
}

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renomeou "middleware" → "proxy" (mesma função de borda).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Roda em tudo, exceto assets estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

/**
 * Helper de sessão para o middleware: refaz o refresh dos cookies do Supabase
 * e aplica a proteção de rotas. Rotas internas sem sessão → /login.
 * Rotas /admin/* exigem papel = 'admin' no profile.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas acessíveis sem login.
const PUBLIC_PATHS = ["/login", "/cadastro"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdmin(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() revalida o token no servidor (não confie só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Sem sessão em rota interna → manda pro login (guardando o destino).
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Já logado tentando ver login/cadastro → manda pra home.
  if (user && isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Rota admin: verifica papel no profile.
  if (user && isAdmin(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("papel")
      .eq("id", user.id)
      .single();

    if (!profile || profile.papel !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}


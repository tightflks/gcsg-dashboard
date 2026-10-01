import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isDemoMode, isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  if (!isSupabaseConfigured) {
    if (isAdmin && !isDemoMode) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  let user: unknown = null;
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // Never take the whole site down over auth: log it, keep public pages up,
    // and treat the visitor as signed out (so /admin still fails closed).
    console.error("[middleware] Supabase session check failed — check NEXT_PUBLIC_SUPABASE_* env vars:", err);
    response = NextResponse.next({ request });
  }

  if (isAdmin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Board & Staff Login · GCSG" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/admin", error } = await searchParams;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="sidebar-logo" style={{ width: 38, height: 38, borderRadius: 10, background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            GC
          </div>
          <div>
            <div className="tracked" style={{ color: "var(--khaki)", fontSize: 10.5, fontWeight: 700 }}>Internal — Not For Distribution</div>
            <div className="display" style={{ color: "var(--forest-700)", fontSize: 22, fontWeight: 600 }}>Board &amp; Staff Login</div>
          </div>
        </div>

        {error === "link" && (
          <p className="form-msg err" style={{ color: "var(--tone-blocked-fg)" }}>
            That sign-in link is invalid or has expired. Request a new one below.
          </p>
        )}

        {isSupabaseConfigured ? (
          <LoginForm next={next} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "var(--ink-3)", lineHeight: 1.6 }}>
            <p>
              Supabase isn&apos;t configured yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign-in.
            </p>
            {isDemoMode && (
              <Link href="/admin" className="btn-pill" style={{ alignSelf: "flex-start" }}>
                Open demo dashboard
              </Link>
            )}
          </div>
        )}

        <Link href="/" className="btn-link" style={{ alignSelf: "flex-start" }}>
          ← Back to public view
        </Link>
      </div>
    </div>
  );
}

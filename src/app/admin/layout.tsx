import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { getViewer } from "@/lib/data";
import { redirect } from "next/navigation";

export const metadata = { title: "Board & Staff Dashboard · GCSG" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  if (!viewer.isStaff) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="display" style={{ color: "var(--forest-700)", fontSize: 22, fontWeight: 600 }}>Access pending</div>
          <p style={{ color: "var(--ink-3)", fontSize: 14, lineHeight: 1.6 }}>
            You&apos;re signed in as <b>{viewer.email}</b>, but this address isn&apos;t on the GCSG staff list yet. Ask an
            administrator to add it to the <code>staff</code> table in Supabase.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <form action={signOut}>
              <button type="submit" className="btn-pill">Sign out</button>
            </form>
            <Link href="/" className="btn-ghost">Public view</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <Sidebar />
      <div className="admin-main">
        <Suspense>
          <Topbar viewer={viewer} />
        </Suspense>
        {viewer.demo && (
          <div className="banner">
            Demo mode — showing spreadsheet seed data. Changes won&apos;t be saved until Supabase is connected.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getActions, getMilestones, getResources, getVendorTerms, getVendors } from "@/lib/data";

const RISK_TONE: Record<string, string> = { HIGH: "blocked", MEDIUM: "progress", LOW: "done", ACTION: "progress" };

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [vendors, terms, milestones, actions, resources] = await Promise.all([
    getVendors(),
    getVendorTerms(),
    getMilestones(),
    getActions(),
    getResources(),
  ]);
  const vendor = vendors.find((v) => v.slug === slug);
  if (!vendor) notFound();

  const name = vendor.name.toLowerCase();
  const vTerms = terms.filter((t) => t.vendor_slug === slug);
  const vMilestones = milestones.filter((m) => `${m.title} ${m.detail}`.toLowerCase().includes(name));
  const vActions = actions.filter((a) => `${a.title} ${a.note}`.toLowerCase().includes(name));
  const vResources = resources.filter((r) => `${r.name} ${r.description}`.toLowerCase().includes(name) || (slug === "evive" && r.name.includes("Pilot SOW")));

  return (
    <div className="admin-body">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href="/admin#risk" className="btn-link">← Overview</Link>
        <div className="chips">
          {vendors.map((v) => (
            <Link key={v.slug} href={`/admin/vendors/${v.slug}`} className={`chip${v.slug === slug ? " on" : ""}`}>{v.name}</Link>
          ))}
        </div>
      </div>

      <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h1 className="display" style={{ color: "var(--forest-700)", fontSize: 28, fontWeight: 600 }}>{vendor.name}</h1>
            <span className={`badge tone-${vendor.status_tone ?? "upcoming"}`}>{vendor.status_label}</span>
            <span className={`badge tone-${vendor.risk_tone ?? "upcoming"}`}>{vendor.risk_label}</span>
          </div>
          <div style={{ color: "#6B7A6F", fontSize: 13, fontWeight: 600 }}>{vendor.role}</div>
          <p style={{ color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.65 }}>{vendor.detail}</p>
          {vendor.risk_points.map((pt) => (
            <div key={pt} style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, display: "flex", gap: 8 }}>
              <span style={{ color: "#C77C3E" }}>•</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", background: "var(--forest-700)" }}>
          <div className="tracked" style={{ color: "#A9C2AF", fontSize: 10.5, fontWeight: 700 }}>Contract Value</div>
          <div className="display" style={{ color: "var(--gold)", fontSize: 34, fontWeight: 600 }}>{vendor.cost_label}</div>
          <div className="tracked" style={{ color: "#8AA894", fontSize: 10 }}>{vendor.signed ? "Signed" : "Not yet signed"}</div>
          {vResources.map((r) =>
            r.url ? (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="btn-pill" style={{ alignSelf: "flex-start" }}>
                {r.name} ↗
              </a>
            ) : null,
          )}
        </div>
      </div>

      {vTerms.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tracked label-sm">Agreement Analysis</div>
          <div className="card">
            {vTerms.map((t) => (
              <div key={t.id} className="tl-row" style={{ gridTemplateColumns: "110px 1.2fr 2.6fr 90px" }}>
                <div className="tracked" style={{ fontSize: 10, fontWeight: 700, color: "var(--khaki)" }}>{t.section}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{t.term}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-4)", lineHeight: 1.5 }}>{t.detail}</div>
                <span className={`badge tone-${RISK_TONE[t.risk_level ?? ""] ?? "upcoming"}`} style={{ fontSize: 9.5 }}>{t.risk_level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tracked label-sm">Related Action Items</div>
          <div className="card" style={{ padding: 10 }}>
            {vActions.length === 0 && <div className="empty">None.</div>}
            {vActions.map((a) => (
              <Link key={a.id} href="/admin#actions" className="res-row">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{a.title}</span>
                <span className="tracked" style={{ fontSize: 10, color: "var(--khaki)" }}>{a.status.replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tracked label-sm">Timeline Mentions</div>
          <div className="card" style={{ padding: 10 }}>
            {vMilestones.length === 0 && <div className="empty">None.</div>}
            {vMilestones.map((m) => (
              <Link key={m.id} href="/admin#timeline" className="res-row">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{m.title}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--khaki)", whiteSpace: "nowrap" }}>{m.date_label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

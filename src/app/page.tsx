import Link from "next/link";
import { Icon } from "@/components/Icon";
import { RequestMaterials } from "@/components/public/RequestMaterials";
import { SubNav } from "@/components/public/SubNav";
import { SubscribeForm } from "@/components/public/SubscribeForm";
import { VendorButton, VendorModalProvider } from "@/components/public/VendorModal";
import { getBoard, getMilestones, getVendors } from "@/lib/data";

export const dynamic = "force-dynamic";

const GET_HELP_URL = "https://georgiasafergaming.org/get-help/";
const IN_THE_KNOW_URL = "https://georgiasafergaming.org/in-the-know/";
const HELPLINE_TEL = "tel:+18006973738"; // 1-800-MY-RESET
const PROGRAM_BUDGET = "$1.26M";
const COMMITTED = "$250K+";

const SEGMENT_COLORS = [
  { bg: "#16472F", fg: "#F7F3E9" },
  { bg: "#4C8A63", fg: "#F7F3E9" },
  { bg: "#E8956F", fg: "#1D2B22" },
  { bg: "#9A8B5F", fg: "#F7F3E9" },
];

const SERVE = [
  { name: "Fantasy Sports", note: "Daily fantasy and season-long leagues.", icon: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z" },
  { name: "Prediction Markets", note: "Event contracts and yes/no outcome trading.", icon: "M3 3v18h18 M18.7 8l-5.1 5.1-2.8-2.8L7 14.1" },
  { name: "Lottery & Scratch-Offs", note: "Georgia Lottery and instant-win games.", icon: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z M13 5v2 M13 17v2 M13 11v2" },
  { name: "Online Games", note: "Skill games, sweepstakes, and gaming-adjacent apps.", icon: "M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.01-.1-.017-.151A4 4 0 0 0 17.32 5Z" },
];

const STEPS = [
  { title: "Confidential assessment", detail: "Call or text 1-800-MY-RESET, free and confidential, 24/7. A trained specialist listens first — no judgment, no obligation." },
  { title: "Kindbridge connects you", detail: "Kindbridge Behavioral Health routes the call, matching you with the right level of support — from a quick conversation to a full treatment referral." },
  { title: "Ongoing support, if you want it", detail: "Follow-up resources, treatment options through Kindbridge or Birches Health, and blocking software through Gamban are all available as next steps — on your terms." },
];

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;
const numberWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six"];

export default async function PublicPage() {
  const [vendors, board, milestones] = await Promise.all([
    getVendors(),
    getBoard(),
    getMilestones({ publicOnly: true }),
  ]);
  const totalVendor = vendors.reduce((s, v) => s + (v.annual_cost ?? 0), 0);
  const updated = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  const vendorWord = numberWords[vendors.length]?.toLowerCase() ?? String(vendors.length);

  const quickFacts = [
    { value: "2026", label: "Year founded — first official board meeting held Sep 2, 2026" },
    { value: String(vendors.length), label: "Vendor partners forming the responsible-gaming stack" },
    { value: PROGRAM_BUDGET, label: "Current program budget, board-approved" },
    { value: COMMITTED, label: "Committed to date from founding donors" },
  ];

  return (
    <VendorModalProvider vendors={vendors}>
      <header id="top" className="pub-nav reveal">
        <Link href="/" className="brand display">
          Georgia Council
          <br />
          for Safer Gaming
        </Link>
        <div className="links">
          <a href={IN_THE_KNOW_URL} target="_blank" rel="noopener noreferrer" className="know tracked">
            In The Know
          </a>
          <a href={GET_HELP_URL} target="_blank" rel="noopener noreferrer" className="btn-pill">
            Get Help
          </a>
          <Link href="/login" className="login tracked">
            Board &amp; Staff Login
          </Link>
        </div>
      </header>

      <SubNav />

      <main>
        <section className="hero">
          <div className="eyebrow tracked hero-in" style={{ animationDelay: ".05s" }}>Public Transparency Report</div>
          <h1 className="display hero-in" style={{ animationDelay: ".15s" }}>Built in the open.</h1>
          <p className="hero-in" style={{ animationDelay: ".28s" }}>
            A running, public account of GCSG&apos;s funding, vendor partners, and program milestones — refreshed after
            every board meeting so donors and Georgians can see exactly where things stand.
          </p>
          <div className="meta hero-in" style={{ animationDelay: ".4s" }}>
            Last updated {updated} &nbsp;·&nbsp; Sourced from board minutes and signed vendor contracts
          </div>
        </section>

        <div className="facts reveal" style={{ animationDelay: ".18s" }}>
          {quickFacts.map((f) => (
            <div key={f.label}>
              <div className="v display">{f.value}</div>
              <div className="l">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Vendor status */}
        <section id="status" className="section reveal" style={{ paddingBottom: 40 }}>
          <div className="section-head">
            <div className="eyebrow tracked">Vendor Program Status</div>
            <h2 className="display">
              {vendorWord[0]?.toUpperCase() + vendorWord.slice(1)} partners, {vendorWord} different stages.
            </h2>
            <p>
              GCSG runs a lean, {vendorWord}-vendor model rather than building services in-house. Here&apos;s exactly
              where each contract and integration stands.
            </p>
          </div>
          <div className="grid-3">
            {vendors.map((v) => (
              <VendorButton key={v.slug} slug={v.slug} className="paper vendor-card" label={`${v.name} details`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="name display">{v.name}</div>
                  <span className={`badge tone-${v.status_tone ?? "upcoming"}`}>{v.status_label}</span>
                </div>
                <div className="role">{v.role}</div>
                <div className="rule" />
                <p className="detail">{v.detail}</p>
                <div className="cost">
                  <span>{v.cost_label}</span>
                  <span aria-hidden="true">Details →</span>
                </div>
              </VendorButton>
            ))}
          </div>
        </section>

        {/* Budget */}
        <section id="budget" className="section alt reveal" style={{ gap: 44 }}>
          <div className="section-head">
            <div className="eyebrow tracked">Financial Transparency</div>
            <h2 className="display">Where the budget goes.</h2>
          </div>
          <div className="budget-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ color: "var(--ink-2)", fontSize: 14, fontWeight: 600 }}>
                  Annual vendor cost — ${totalVendor.toLocaleString("en-US")}
                </div>
                <div style={{ color: "var(--khaki-2)", fontSize: 12.5 }}>of a {PROGRAM_BUDGET} program budget</div>
              </div>
              <div className="budget-bar">
                {vendors.map((v, i) => {
                  const pct = totalVendor ? ((v.annual_cost ?? 0) / totalVendor) * 100 : 0;
                  const c = SEGMENT_COLORS[i % SEGMENT_COLORS.length]!;
                  return (
                    <VendorButton
                      key={v.slug}
                      slug={v.slug}
                      style={{ width: `${pct}%`, background: c.bg, color: c.fg }}
                      label={`${v.name}: ${fmtK(v.annual_cost ?? 0)} (${pct.toFixed(1)}%)`}
                    >
                      {pct > 16 ? `${v.name} · ${fmtK(v.annual_cost ?? 0)}` : fmtK(v.annual_cost ?? 0)}
                    </VendorButton>
                  );
                })}
              </div>
              <p style={{ marginTop: 4, color: "var(--ink-4)", fontSize: 13.5, lineHeight: 1.6 }}>
                At the current lean, {vendorWord}-vendor structure, the base budget funds roughly three years of runway
                before any new fundraising is required.
              </p>
            </div>
            <div className="callout">
              <div className="big display">{COMMITTED}</div>
              <p>
                Committed to date across founding donors — including the board&apos;s own personal commitments — ahead
                of any public fundraising push.
              </p>
            </div>
          </div>
        </section>

        {/* Who we serve */}
        <section id="serve" className="section reveal">
          <div className="section-head">
            <div className="eyebrow tracked">Who We Serve</div>
            <h2 className="display">Fantasy. Prediction markets. Lottery. Online games.</h2>
            <p>
              It doesn&apos;t matter what you&apos;re playing. If the losses are piling up — in money, time, or energy —
              support is available, 24/7. All calls and messages are free and confidential.
            </p>
          </div>
          <div className="grid-4">
            {SERVE.map((c) => (
              <div key={c.name} className="paper serve-card">
                <div className="icon"><Icon path={c.icon} /></div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest-700)" }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-4)", lineHeight: 1.5 }}>{c.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How help works */}
        <section id="works" className="section alt reveal">
          <div className="section-head">
            <div className="eyebrow tracked">How Help Works</div>
            <h2 className="display">Three steps, no wrong door.</h2>
          </div>
          <div>
            {STEPS.map((s, i) => (
              <div key={s.title} className="step">
                <div className="n display">{i + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--forest-700)" }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 640 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={HELPLINE_TEL} className="btn-pill"><Icon name="phone" size={14} /> Call 1-800-MY-RESET</a>
            <a href={GET_HELP_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">More ways to get help</a>
          </div>
        </section>

        {/* Timeline */}
        <section id="timeline-section" className="section reveal" style={{ gap: 44 }}>
          <div className="section-head">
            <div className="eyebrow tracked">Progress Timeline</div>
            <h2 className="display">From mission to launch.</h2>
          </div>
          <div className="timeline">
            {milestones.map((m) => (
              <div key={m.id}>
                <div className="dotline">
                  <div className={`dot${m.status === "complete" ? "" : " active"}`} title={m.status.replace("_", " ")} />
                  <div className="line" />
                </div>
                <div className="tracked" style={{ color: "var(--khaki-2)", fontSize: 11, fontWeight: 700 }}>{m.date_label}</div>
                <div style={{ color: "var(--forest-700)", fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                  {m.public_title ?? m.title}
                </div>
                <div style={{ color: "var(--ink-4)", fontSize: 12.5, lineHeight: 1.5 }}>{m.public_note ?? m.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Funding */}
        <section className="funded reveal">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="tracked" style={{ color: "var(--orange)", fontSize: 12.5, fontWeight: 700 }}>How We&apos;re Funded</div>
            <h2 className="display" style={{ color: "var(--forest-700)", fontSize: 30 }}>Private dollars, on purpose.</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14.5, lineHeight: 1.65, maxWidth: 480 }}>
              GCSG runs on founding-donor commitments, not state or federal grants. That&apos;s a deliberate choice: no
              grant money means no political entanglement, and no dependence on any single funding source that could
              compromise our independence.
            </p>
          </div>
          <div className="callout" style={{ padding: 30, gap: 10 }}>
            <div className="display" style={{ color: "var(--gold)", fontSize: 30, fontWeight: 500 }}>$0 in state or federal grants</div>
            <p style={{ fontSize: 13.5 }}>
              A private-donation model keeps GCSG free to stay critical of industry practices, even while accepting
              industry dollars — unlike councils that answer to a single national body.
            </p>
          </div>
        </section>

        {/* Board */}
        <section id="team" className="section reveal">
          <div className="section-head">
            <div className="eyebrow tracked">Board &amp; Leadership</div>
            <h2 className="display">Who&apos;s accountable for this.</h2>
          </div>
          <div className="grid-4">
            {board.map((p) => (
              <div key={p.name} className="paper board-card">
                <div className="avatar display">{p.initials}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ color: "var(--forest-700)", fontSize: 15.5, fontWeight: 700 }}>{p.name}</div>
                  <div className="tracked" style={{ color: "var(--khaki)", fontSize: 11.5, fontWeight: 600 }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="partners reveal">
          <div className="names">
            {vendors.map((v) => (
              <VendorButton key={v.slug} slug={v.slug} className="display" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                {v.name.toUpperCase()}
              </VendorButton>
            ))}
            <span className="display">AGA · RESPONSIBLE GAMING</span>
          </div>
          <div className="req">
            <div style={{ color: "#F0E4C8", fontSize: 13, lineHeight: 1.4 }}>
              Donor deck &amp; full proposal
              <br />
              available on request.
            </div>
            <RequestMaterials />
          </div>
        </section>

        {/* CTA */}
        <section className="cta reveal">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 620 }}>
            <div className="display" style={{ color: "var(--coral)", fontSize: 26, fontWeight: 500 }}>
              This page tracks our progress. This number is for you.
            </div>
            <div style={{ color: "#C7D6CB", fontSize: 14.5, lineHeight: 1.6 }}>
              Talk to someone at <a className="phone" href={HELPLINE_TEL}>1-800-MY-RESET</a> — free and confidential,
              24/7. Text and live chat through Kindbridge&apos;s 877-GAM-HALT line are rolling out now.
            </div>
          </div>
          <a href={GET_HELP_URL} target="_blank" rel="noopener noreferrer" className="btn-pill lg">Get Help Now</a>
        </section>

        {/* Newsletter */}
        <section className="newsletter">
          <div style={{ color: "#C7D6CB", fontSize: 13.5, maxWidth: 420, lineHeight: 1.5 }}>
            Get notified when this page updates — new vendor status, budget changes, and board decisions, straight to
            your inbox.
          </div>
          <SubscribeForm />
        </section>
      </main>

      <footer className="pub-footer">
        <span>© {new Date().getFullYear()} Georgia Council for Safer Gaming</span>
        <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="https://georgiasafergaming.org/" target="_blank" rel="noopener noreferrer">georgiasafergaming.org</a>
          <a href="#top">Back to top ↑</a>
          <Link href="/login">Staff login</Link>
        </span>
      </footer>
    </VendorModalProvider>
  );
}

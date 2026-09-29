"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { deleteAction, setActionStatus, setMilestoneStatus, toggleMilestonePublic, type Result } from "@/app/actions";
import { Icon } from "@/components/Icon";
import {
  ACTION_STATUSES,
  MILESTONE_STATUSES,
  type ActionItem,
  type ActionStatus,
  type Meeting,
  type Milestone,
  type MilestoneStatus,
  type Resource,
  type Vendor,
} from "@/lib/types";
import { ActionForm } from "./ActionForm";
import { StatusPicker } from "./StatusPicker";
import { useToast } from "./useToast";

type Filter = "all" | "overdue" | "blocked" | "open" | "done";
const BLOCKED: ActionStatus[] = ["blocked", "not_done", "in_review"];
const FILTERS: { key: Filter; label: string; test: (a: ActionItem) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "overdue", label: "Overdue", test: (a) => a.status === "overdue" },
  { key: "blocked", label: "Blocked", test: (a) => BLOCKED.includes(a.status) },
  { key: "open", label: "Open", test: (a) => a.status === "open" },
  { key: "done", label: "Done", test: (a) => a.status === "done" },
];

const SPEND_COLORS = ["#16472F", "#4C8A63", "#E8956F", "#9A8B5F"];

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const includes = (q: string, ...fields: (string | null | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(q));

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function Dashboard(props: {
  today: string;
  actions: ActionItem[];
  milestones: Milestone[];
  meetings: Meeting[];
  resources: Resource[];
  vendors: Vendor[];
  boardCount: number;
}) {
  const { today, meetings, resources, vendors, boardCount } = props;
  const router = useRouter();
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();
  const { toast, node: toastNode } = useToast();
  const [, startTransition] = useTransition();

  // Local copies for optimistic updates; resync whenever the server sends fresh data.
  const [actions, setActions] = useState(props.actions);
  const [milestones, setMilestones] = useState(props.milestones);
  useEffect(() => setActions(props.actions), [props.actions]);
  useEffect(() => setMilestones(props.milestones), [props.milestones]);

  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<ActionItem | null | "new">(null);
  const [section, setSection] = useState<string>("All");

  const run = useCallback(
    (fn: () => Promise<Result>, revert: () => void, ok: string) => {
      startTransition(async () => {
        const res = await fn().catch(() => ({ ok: false as const, message: "Couldn't save that change." }));
        if (!res.ok) revert();
        toast(res.ok ? ok : res.message);
      });
    },
    [toast],
  );

  const changeActionStatus = (id: number, status: ActionStatus) => {
    const prev = actions;
    setActions((as) => as.map((a) => (a.id === id ? { ...a, status } : a)));
    run(() => setActionStatus(id, status), () => setActions(prev), "Status updated");
  };
  const removeAction = (item: ActionItem) => {
    if (!confirm(`Delete “${item.title}”?`)) return;
    const prev = actions;
    setActions((as) => as.filter((a) => a.id !== item.id));
    run(() => deleteAction(item.id), () => setActions(prev), "Action deleted");
  };
  const changeMilestoneStatus = (id: number, status: MilestoneStatus) => {
    const prev = milestones;
    setMilestones((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    run(() => setMilestoneStatus(id, status), () => setMilestones(prev), "Timeline updated");
  };
  const togglePublic = (m: Milestone) => {
    const prev = milestones;
    setMilestones((ms) => ms.map((x) => (x.id === m.id ? { ...x, is_public: !m.is_public } : x)));
    run(
      () => toggleMilestonePublic(m.id, !m.is_public),
      () => setMilestones(prev),
      m.is_public ? "Hidden from public page" : "Shown on public page",
    );
  };

  // ── Search ──────────────────────────────────────────────────────────────
  const fActions = q ? actions.filter((a) => includes(q, a.title, a.owner, a.note, a.status)) : actions;
  const fMilestones = q ? milestones.filter((m) => includes(q, m.title, m.detail, m.date_label)) : milestones;
  const fMeetings = q ? meetings.filter((m) => includes(q, m.title, m.subtitle, m.date)) : meetings.slice(0, 4);
  const fResources = (q ? resources.filter((r) => includes(q, r.name, r.description, r.section, r.kind)) : resources).filter(
    (r) => section === "All" || r.section === section,
  );
  const fVendors = q ? vendors.filter((v) => includes(q, v.name, v.role, v.risk_label, ...v.risk_points)) : vendors;
  const hits = q ? fActions.length + fMilestones.length + fMeetings.length + fResources.length + fVendors.length : 0;

  // ── KPIs ────────────────────────────────────────────────────────────────
  const openCount = actions.filter((a) => a.status !== "done").length;
  const overdueCount = actions.filter((a) => a.status === "overdue").length;
  const signed = vendors.filter((v) => v.signed);
  const unsigned = vendors.filter((v) => !v.signed);
  const nextMilestone = milestones.find((m) => m.status === "overdue" || m.status === "in_progress") ??
    milestones.find((m) => m.status === "upcoming");
  const nextNote = (() => {
    if (!nextMilestone?.sort_date) return nextMilestone ? "Date to be confirmed" : "Nothing scheduled";
    const d = daysBetween(today, nextMilestone.sort_date);
    if (d < 0) return `Overdue by ${-d} day${d === -1 ? "" : "s"}`;
    if (d === 0) return "Due today";
    return `In ${d} day${d === 1 ? "" : "s"}`;
  })();
  const totalSpend = vendors.reduce((s, v) => s + (v.annual_cost ?? 0), 0);
  const maxSpend = Math.max(1, ...vendors.map((v) => v.annual_cost ?? 0));
  const sections = useMemo(() => ["All", ...new Set(resources.map((r) => r.section ?? "Other"))], [resources]);

  const kpis = [
    {
      label: "Open Action Items", value: String(openCount), note: `${overdueCount} overdue`,
      bars: [16, 22, 14, 28, 20, 26].map((h, i) => ({ h, c: i >= 4 ? "#E8956F" : "#2E6B47" })),
      onClick: () => { setFilter(overdueCount ? "overdue" : "all"); scrollTo("actions"); },
    },
    {
      label: "Contracts Signed", value: `${signed.length} / ${vendors.length}`,
      note: unsigned.length ? `${unsigned.map((v) => v.name).join(", ")} pending` : "All signed",
      bars: [24, 24, 24, 10, 10, 10].map((h, i) => ({ h, c: i < 3 ? "#2E6B47" : "#DDE3D7" })),
      onClick: () => scrollTo("risk"),
    },
    {
      label: nextMilestone?.title.toLowerCase().includes("go-live") ? "Go-Live Target" : "Next Milestone",
      value: nextMilestone?.date_label ?? "—", note: nextNote,
      bars: [10, 14, 18, 22, 26, 24].map((h, i) => ({ h, c: i === 5 ? "#B85A2E" : "#F0A93E" })),
      onClick: () => scrollTo("timeline"),
    },
    {
      label: "Board Directors", value: String(boardCount), note: "Quarterly cadence",
      bars: [18, 18, 18, 18, 18, 18].map((h) => ({ h, c: "#2E6B47" })),
      onClick: () => router.push("/admin/meetings"),
    },
  ];

  const visibleActions = fActions.filter(FILTERS.find((f) => f.key === filter)!.test);

  return (
    <div className="admin-body">
      {q && (
        <div className="card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
            <b>{hits}</b> match{hits === 1 ? "" : "es"} for “{q}” on this page.{" "}
            <Link className="btn-link" href={`/admin/meetings?q=${encodeURIComponent(q)}`}>Search full meeting notes →</Link>
          </div>
          <Link href="/admin" className="btn-ghost">Clear search</Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid-4" style={{ gap: 20 }}>
        {kpis.map((k) => (
          <button key={k.label} type="button" className="card kpi" onClick={k.onClick}>
            <div className="tracked" style={{ color: "var(--khaki)", fontSize: 10, fontWeight: 700 }}>{k.label}</div>
            <div className="display" style={{ color: "var(--forest-700)", fontSize: 30, fontWeight: 600 }}>{k.value}</div>
            <div className="bars" aria-hidden="true">
              {k.bars.map((b, i) => <div key={i} style={{ height: b.h, background: b.c }} />)}
            </div>
            <div style={{ color: "var(--ink-5)", fontSize: 11.5 }}>{k.note}</div>
          </button>
        ))}
      </div>

      {/* Budget */}
      <div id="budget" className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, scrollMarginTop: 100 }}>
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="display" style={{ color: "var(--forest-700)", fontSize: 17, fontWeight: 600 }}>Annual Vendor Spend</div>
            <div className="mono" style={{ color: "var(--khaki)", fontSize: 11.5 }}>${totalSpend.toLocaleString("en-US")} / yr</div>
          </div>
          <div className="spend">
            {vendors.map((v, i) => (
              <button key={v.slug} type="button" onClick={() => router.push(`/admin/vendors/${v.slug}`)} aria-label={`${v.name} vendor details`}>
                <div className="mono" style={{ fontSize: 11, color: "var(--forest-700)", fontWeight: 600 }}>
                  ${Math.round((v.annual_cost ?? 0) / 1000)}K
                </div>
                <div className="bar" style={{ height: `${Math.max(8, ((v.annual_cost ?? 0) / maxSpend) * 100)}%`, background: SPEND_COLORS[i % SPEND_COLORS.length] }} />
                <div className="tracked" style={{ fontSize: 9.5, color: "var(--khaki)", fontWeight: 700 }}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center", background: "var(--forest-700)" }}>
          <div className="tracked" style={{ color: "#A9C2AF", fontSize: 10.5, fontWeight: 700 }}>Committed To Date</div>
          <div className="display" style={{ color: "var(--gold)", fontSize: 40, fontWeight: 600 }}>$250K+</div>
          <div style={{ height: 1, background: "rgba(255,255,255,.12)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div>
              <div className="mono" style={{ color: "#F7F3E9", fontSize: 16, fontWeight: 600 }}>$1.26M</div>
              <div className="tracked" style={{ color: "#8AA894", fontSize: 9.5 }}>Base Budget</div>
            </div>
            <div>
              <div className="mono" style={{ color: "#F7F3E9", fontSize: 16, fontWeight: 600 }}>~3 yrs</div>
              <div className="tracked" style={{ color: "#8AA894", fontSize: 9.5 }}>Runway</div>
            </div>
            <Link href="/#budget" className="btn-pill" style={{ padding: "8px 14px", fontSize: 10.5 }}>Public view</Link>
          </div>
        </div>
      </div>

      {/* Action items */}
      <div id="actions" className="card" style={{ padding: "8px 0 20px", scrollMarginTop: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px 16px", gap: 12, flexWrap: "wrap" }}>
          <div className="display" style={{ color: "var(--forest-700)", fontSize: 17, fontWeight: 600 }}>Open Action Items</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div className="chips" role="tablist" aria-label="Filter action items">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`chip ${f.key}${filter === f.key ? " on" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label} ({fActions.filter(f.test).length})
                </button>
              ))}
            </div>
            <button type="button" className="btn-dark" onClick={() => setEditing("new")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
        </div>
        <div className="table-head">
          <div>Action</div><div>Owner</div><div>Status</div><div>Notes</div><div />
        </div>
        {visibleActions.length === 0 && <div className="empty">No action items match this view.</div>}
        {visibleActions.map((a) => (
          <div key={a.id} className="table-row">
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--forest-700)" }}>
              {a.title}
              {a.due_date && (
                <div className="mono" style={{ fontSize: 10.5, color: "var(--khaki)", fontWeight: 500, marginTop: 4 }}>Due {fmtDate(a.due_date)}</div>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{a.owner}</div>
            <StatusPicker value={a.status} options={ACTION_STATUSES} onChange={(s) => changeActionStatus(a.id, s)} />
            <div style={{ fontSize: 12.5, color: "var(--ink-4)", lineHeight: 1.5 }}>{a.note}</div>
            <div className="row-actions">
              <button type="button" className="icon-btn" aria-label={`Edit ${a.title}`} onClick={() => setEditing(a)}>
                <Icon name="edit" size={13} />
              </button>
              <button type="button" className="icon-btn" aria-label={`Delete ${a.title}`} onClick={() => removeAction(a)}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor risk */}
      <div id="risk" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 100 }}>
        <div className="tracked label-sm">Vendor Contract &amp; Risk Notes</div>
        <div className="grid-3" style={{ gap: 20 }}>
          {fVendors.map((v) => (
            <Link key={v.slug} href={`/admin/vendors/${v.slug}`} className="card meeting-card" style={{ padding: 22, gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest-700)" }}>{v.name}</div>
                <span className={`badge tone-${v.risk_tone ?? "upcoming"}`} style={{ fontSize: 9.5 }}>{v.risk_label}</span>
              </div>
              <div style={{ height: 1, background: "var(--admin-row)" }} />
              {v.risk_points.map((pt) => (
                <div key={pt} style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, display: "flex", gap: 8 }}>
                  <span style={{ color: "#C77C3E" }}>•</span>
                  <span>{pt}</span>
                </div>
              ))}
              <span className="btn-link" style={{ marginTop: "auto" }}>Full contract analysis →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div id="timeline" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div className="tracked label-sm">Full Progress Timeline</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-5)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="eye" size={13} /> = shown on public page
          </div>
        </div>
        <div className="card">
          {fMilestones.length === 0 && <div className="empty">No milestones match.</div>}
          {fMilestones.map((t) => (
            <div key={t.id} className="tl-row">
              <div className="mono" style={{ fontSize: 11.5, color: "var(--khaki)" }}>{t.date_label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-4)", lineHeight: 1.5 }}>{t.detail}</div>
              <StatusPicker value={t.status} options={MILESTONE_STATUSES} onChange={(s) => changeMilestoneStatus(t.id, s)} />
              <button
                type="button"
                className={`eye${t.is_public ? " on" : ""}`}
                aria-pressed={t.is_public}
                aria-label={t.is_public ? "Hide from public page" : "Show on public page"}
                title={t.is_public ? "Shown on public page — click to hide" : "Hidden from public page — click to show"}
                onClick={() => togglePublic(t)}
              >
                <Icon name={t.is_public ? "eye" : "eyeOff"} size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Meetings + resources */}
      <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div id="meetings" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="tracked label-sm">{q ? "Matching Meetings" : "Recent Meeting Log"}</div>
            <Link href="/admin/meetings" className="btn-link">View all {meetings.length} →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fMeetings.length === 0 && <div className="card empty">No meetings match.</div>}
            {fMeetings.map((m) => (
              <Link key={m.slug} href={`/admin/meetings/${m.slug}`} className="card meeting-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest-700)" }}>{m.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--khaki)", whiteSpace: "nowrap" }}>{fmtDate(m.date)}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55 }}>{m.subtitle ?? "Weekly check-in"}</div>
              </Link>
            ))}
          </div>
        </div>
        <div id="resources" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tracked label-sm">Resources &amp; Links</div>
          <div className="chips">
            {sections.map((s) => (
              <button key={s} type="button" className={`chip${section === s ? " on" : ""}`} onClick={() => setSection(s)} style={{ fontSize: 10.5, padding: "5px 11px" }}>
                {s}
              </button>
            ))}
          </div>
          <div className="card" style={{ padding: 10, display: "flex", flexDirection: "column" }}>
            {fResources.length === 0 && <div className="empty">No resources match.</div>}
            {fResources.map((r) => {
              const inner = (
                <>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{r.name}</div>
                    {r.description && <div style={{ fontSize: 11.5, color: "var(--ink-5)", marginTop: 2 }}>{r.description}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--khaki)", flexShrink: 0 }}>
                    <span className="tracked" style={{ fontSize: 10 }}>{r.kind}</span>
                    {r.url && <Icon name="external" size={13} />}
                  </div>
                </>
              );
              return r.url ? (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="res-row">{inner}</a>
              ) : (
                <div key={r.id} className="res-row">{inner}</div>
              );
            })}
          </div>
        </div>
      </div>

      {editing && (
        <ActionForm
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setEditing(null);
            toast(m);
            router.refresh();
          }}
        />
      )}
      {toastNode}
    </div>
  );
}

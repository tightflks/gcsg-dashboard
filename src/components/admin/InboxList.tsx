"use client";

import { useEffect, useState, useTransition } from "react";
import { markRequestHandled } from "@/app/actions";
import type { MaterialRequest, Subscriber } from "@/lib/data";
import { useToast } from "./useToast";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function InboxList(props: { requests: MaterialRequest[]; subscribers: Subscriber[] }) {
  const [requests, setRequests] = useState(props.requests);
  useEffect(() => setRequests(props.requests), [props.requests]);
  const [, start] = useTransition();
  const { toast, node } = useToast();
  const [copied, setCopied] = useState(false);

  const toggle = (r: MaterialRequest) => {
    const prev = requests;
    setRequests((rs) => rs.map((x) => (x.id === r.id ? { ...x, handled: !r.handled } : x)));
    start(async () => {
      const res = await markRequestHandled(r.id, !r.handled).catch(() => ({ ok: false as const, message: "Couldn't save that change." }));
      if (!res.ok) setRequests(prev);
      toast(res.ok ? (r.handled ? "Marked as open" : "Marked as handled") : res.message);
    });
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(props.subscribers.map((s) => s.email).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't access the clipboard.");
    }
  };

  const downloadCsv = () => {
    const csv = "email,subscribed_at\n" + props.subscribers.map((s) => `${s.email},${s.created_at}`).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "gcsg-subscribers.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="tracked label-sm">Material Requests ({requests.filter((r) => !r.handled).length} open)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.length === 0 && <div className="card empty">No requests yet.</div>}
          {requests.map((r) => (
            <div key={r.id} className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8, opacity: r.handled ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--forest-700)" }}>
                  {r.name}
                  {r.organization && <span style={{ fontWeight: 500, color: "var(--ink-4)" }}> · {r.organization}</span>}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--khaki)" }}>{fmt(r.created_at)}</div>
              </div>
              {r.message && <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55 }}>{r.message}</p>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  className="btn-dark"
                  href={`mailto:${r.email}?subject=${encodeURIComponent("GCSG donor deck & proposal")}`}
                >
                  Reply to {r.email}
                </a>
                <button type="button" className="btn-ghost" onClick={() => toggle(r)}>
                  {r.handled ? "Reopen" : "Mark handled"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="tracked label-sm">Newsletter Subscribers ({props.subscribers.length})</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-ghost" onClick={copyEmails} disabled={!props.subscribers.length}>
              {copied ? "Copied!" : "Copy emails"}
            </button>
            <button type="button" className="btn-ghost" onClick={downloadCsv} disabled={!props.subscribers.length}>CSV</button>
          </div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          {props.subscribers.length === 0 && <div className="empty">No subscribers yet.</div>}
          {props.subscribers.map((s) => (
            <a key={s.id} href={`mailto:${s.email}`} className="res-row">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest-700)" }}>{s.email}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--khaki)" }}>{fmt(s.created_at)}</span>
            </a>
          ))}
        </div>
      </div>
      {node}
    </div>
  );
}

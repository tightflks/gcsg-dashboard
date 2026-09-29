"use client";

import { useState } from "react";
import type { MeetingNote, NoteKind } from "@/lib/types";
import { NoteKindBadge } from "./NoteKindBadge";

const TABS: { key: NoteKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "discussion", label: "Discussion" },
  { key: "decision", label: "Decisions" },
  { key: "action", label: "Actions" },
];

export function MeetingNotes({ notes, q }: { notes: MeetingNote[]; q: string }) {
  const [tab, setTab] = useState<NoteKind | "all">("all");
  const shown = tab === "all" ? notes : notes.filter((n) => n.kind === tab);
  const needle = q.toLowerCase();

  return (
    <div className="card" style={{ paddingTop: 16 }}>
      <div className="chips" style={{ padding: "0 24px 14px" }} role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`chip${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label} ({t.key === "all" ? notes.length : notes.filter((n) => n.kind === t.key).length})
          </button>
        ))}
      </div>
      <div className="note-list">
        {shown.length === 0 && <div className="empty">Nothing in this category.</div>}
        {shown.map((n) => {
          const [head, ...rest] = n.body.split(" — ");
          const hasHead = rest.length > 0 && head === head!.toUpperCase() && head!.length < 80;
          const hit = needle && n.body.toLowerCase().includes(needle);
          return (
            <div key={n.id} className="note" style={hit ? { background: "#FFFBF1" } : undefined}>
              <div><NoteKindBadge kind={n.kind} /></div>
              <div>
                {hasHead ? (
                  <>
                    <b style={{ color: "var(--forest-700)" }}>{head}</b> — {rest.join(" — ")}
                  </>
                ) : (
                  n.body
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--khaki)", fontWeight: 600 }}>{n.owner}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

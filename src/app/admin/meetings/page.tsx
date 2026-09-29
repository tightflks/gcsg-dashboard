import Link from "next/link";
import { NoteKindBadge } from "@/components/admin/NoteKindBadge";
import { getMeetings, searchMeetings } from "@/lib/data";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  const start = Math.max(0, i - 80);
  return (
    <>
      {start > 0 && "…"}
      {text.slice(start, i)}
      <mark style={{ background: "#FBEFD9", padding: "0 2px" }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length, i + q.length + 160)}
      {i + q.length + 160 < text.length && "…"}
    </>
  );
}

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const results = q ? await searchMeetings(q) : (await getMeetings()).map((meeting) => ({ meeting, matches: [] }));

  return (
    <div className="admin-body">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Link href="/admin" className="btn-link">← Overview</Link>
          <h1 className="display" style={{ color: "var(--forest-700)", fontSize: 26, fontWeight: 600, marginTop: 8 }}>
            Meeting Notes &amp; Action Items
          </h1>
          <p style={{ color: "var(--ink-4)", fontSize: 13.5, marginTop: 4 }}>
            {q ? `${results.length} meeting${results.length === 1 ? "" : "s"} mention “${q}”` : `${results.length} meetings · newest first`}
          </p>
        </div>
        <form action="/admin/meetings" className="search" style={{ background: "#fff" }}>
          <label htmlFor="mq" className="sr-only">Search notes</label>
          <input id="mq" name="q" type="search" defaultValue={q} placeholder="Search all notes…" />
          <button type="submit" className="btn-dark" style={{ padding: "6px 12px", margin: "4px -10px 4px 0" }}>Search</button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.length === 0 && <div className="card empty">No meeting notes match “{q}”.</div>}
        {results.map(({ meeting: m, matches }) => (
          <Link key={m.slug} href={`/admin/meetings/${m.slug}${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="card meeting-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--forest-700)" }}>{m.title}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--khaki)" }}>{fmt(m.date)}</div>
            </div>
            {m.subtitle && <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{m.subtitle}</div>}
            {matches.slice(0, 3).map((n) => (
              <div key={n.id} style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--ink-4)", lineHeight: 1.5, marginTop: 4 }}>
                <NoteKindBadge kind={n.kind} />
                <span>{highlight(n.body, q)}</span>
              </div>
            ))}
            {matches.length > 3 && <div style={{ fontSize: 12, color: "var(--khaki)" }}>+{matches.length - 3} more matches</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}

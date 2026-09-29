import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { MeetingNotes } from "@/components/admin/MeetingNotes";
import { getMeeting, getMeetings } from "@/lib/data";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ slug }, { q = "" }] = await Promise.all([params, searchParams]);
  const [meeting, all] = await Promise.all([getMeeting(slug), getMeetings()]);
  if (!meeting) notFound();

  const idx = all.findIndex((m) => m.slug === slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const date = new Date(`${meeting.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const sourceLabel = meeting.source_url?.includes("otter.ai")
    ? "Open Otter.ai recording"
    : meeting.source_url?.includes("clickup")
      ? "Open in ClickUp"
      : "Open source";

  return (
    <div className="admin-body">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href={q ? `/admin/meetings?q=${encodeURIComponent(q)}` : "/admin/meetings"} className="btn-link">
          ← {q ? "Search results" : "All meetings"}
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          {newer && <Link href={`/admin/meetings/${newer.slug}`} className="btn-ghost">← Newer</Link>}
          {older && <Link href={`/admin/meetings/${older.slug}`} className="btn-ghost">Older →</Link>}
        </div>
      </div>

      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="mono" style={{ color: "var(--khaki)", fontSize: 12 }}>{date}</div>
        <h1 className="display" style={{ color: "var(--forest-700)", fontSize: 26, fontWeight: 600 }}>{meeting.title}</h1>
        {meeting.subtitle && <p style={{ color: "var(--ink-3)", fontSize: 15 }}>{meeting.subtitle}</p>}
        {meeting.source_url && (
          <a href={meeting.source_url} target="_blank" rel="noopener noreferrer" className="btn-pill" style={{ alignSelf: "flex-start", marginTop: 6 }}>
            {sourceLabel} <Icon name="external" size={13} />
          </a>
        )}
      </div>

      <MeetingNotes notes={meeting.notes ?? []} q={q} />
    </div>
  );
}

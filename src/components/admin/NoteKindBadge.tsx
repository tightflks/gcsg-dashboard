import type { NoteKind } from "@/lib/types";

const META: Record<NoteKind, { label: string; tone: string }> = {
  discussion: { label: "Discussion", tone: "upcoming" },
  decision: { label: "✓ Decision", tone: "done" },
  action: { label: "⚡ Action", tone: "progress" },
};

export function NoteKindBadge({ kind }: { kind: NoteKind }) {
  const m = META[kind];
  return <span className={`badge tone-${m.tone}`} style={{ fontSize: 9.5, height: "fit-content" }}>{m.label}</span>;
}

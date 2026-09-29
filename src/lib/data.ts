import "server-only";
import seed from "@/data/seed.json";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionItem,
  BoardMember,
  Meeting,
  MeetingNote,
  Milestone,
  Resource,
  Vendor,
  VendorTerm,
} from "@/lib/types";

// Offline fallback (no Supabase configured): give seed rows stable ids.
const withIds = <T extends object>(rows: T[]) => rows.map((r, i) => ({ id: i + 1, ...r }));
const fallback = {
  vendors: seed.vendors as unknown as Vendor[],
  board: seed.board_members as BoardMember[],
  milestones: withIds(seed.milestones) as unknown as Milestone[],
  actions: withIds(seed.action_items.map((a, i) => ({ ...a, sort: i + 1 }))) as unknown as ActionItem[],
  resources: withIds(seed.resources) as unknown as Resource[],
  terms: withIds(seed.vendor_terms) as unknown as VendorTerm[],
  meetings: seed.meetings.map((m) => ({ ...m, notes: withIds(m.notes) })) as unknown as Meeting[],
};

async function query<T>(table: string, order: string, fb: T[], ascending = true): Promise<T[]> {
  const supabase = await createClient();
  if (!supabase) return fb;
  const { data, error } = await supabase.from(table).select("*").order(order, { ascending });
  if (error) {
    console.error(`[data] ${table}:`, error.message);
    return [];
  }
  return data as T[];
}

export const getVendors = () => query<Vendor>("vendors", "sort", fallback.vendors);
export const getBoard = () => query<BoardMember>("board_members", "sort", fallback.board);
export const getActions = () => query<ActionItem>("action_items", "sort", fallback.actions);
export const getResources = () => query<Resource>("resources", "sort", fallback.resources);
export const getVendorTerms = () => query<VendorTerm>("vendor_terms", "sort", fallback.terms);

/** RLS limits anon users to public milestones; filter here too for the public page. */
export async function getMilestones({ publicOnly = false } = {}) {
  const rows = await query<Milestone>("milestones", "sort", fallback.milestones);
  return publicOnly ? rows.filter((m) => m.is_public) : rows;
}

export async function getMeetings(): Promise<Meeting[]> {
  const supabase = await createClient();
  if (!supabase) return fallback.meetings.map(({ notes: _notes, ...m }) => m);
  const { data, error } = await supabase.from("meetings").select("*").order("date", { ascending: false });
  if (error) console.error("[data] meetings:", error.message);
  return (data ?? []) as Meeting[];
}

export async function getMeeting(slug: string): Promise<Meeting | null> {
  const supabase = await createClient();
  if (!supabase) return fallback.meetings.find((m) => m.slug === slug) ?? null;
  const { data: meeting } = await supabase.from("meetings").select("*").eq("slug", slug).maybeSingle();
  if (!meeting) return null;
  const { data: notes } = await supabase
    .from("meeting_notes")
    .select("*")
    .eq("meeting_slug", slug)
    .order("sort");
  return { ...(meeting as Meeting), notes: (notes ?? []) as MeetingNote[] };
}

export type Viewer = { email: string; initials: string; name: string | null; isStaff: boolean; demo: boolean };

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  if (!supabase) return { email: "demo@local", initials: "DM", name: "Demo", isStaff: true, demo: true };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: isStaff } = await supabase.rpc("is_staff");
  const { data: staff } = await supabase
    .from("staff")
    .select("display_name, initials")
    .eq("email", user.email)
    .maybeSingle();
  const name = (staff?.display_name as string | undefined) ?? null;
  const initials =
    (staff?.initials as string | undefined) ??
    (name ?? user.email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("");
  return { email: user.email, initials, name, isStaff: Boolean(isStaff), demo: false };
}

/** Meetings whose title/subtitle or any note mentions `q` (case-insensitive). */
export async function searchMeetings(q: string): Promise<{ meeting: Meeting; matches: MeetingNote[] }[]> {
  const needle = q.toLowerCase();
  const supabase = await createClient();
  let meetings: Meeting[];
  let notes: (MeetingNote & { meeting_slug: string })[];
  if (!supabase) {
    meetings = fallback.meetings;
    notes = fallback.meetings.flatMap((m) => (m.notes ?? []).map((n) => ({ ...n, meeting_slug: m.slug })));
  } else {
    const pattern = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const [{ data: ms }, { data: ns }] = await Promise.all([
      supabase.from("meetings").select("*").order("date", { ascending: false }),
      supabase.from("meeting_notes").select("*").ilike("body", pattern).order("sort"),
    ]);
    meetings = (ms ?? []) as Meeting[];
    notes = (ns ?? []) as (MeetingNote & { meeting_slug: string })[];
  }
  return meetings
    .map((meeting) => ({
      meeting,
      matches: notes.filter((n) => n.meeting_slug === meeting.slug && n.body.toLowerCase().includes(needle)),
    }))
    .filter(({ meeting, matches }) => matches.length || `${meeting.title} ${meeting.subtitle ?? ""}`.toLowerCase().includes(needle));
}

export type MaterialRequest = {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  message: string | null;
  handled: boolean;
  created_at: string;
};
export type Subscriber = { id: number; email: string; created_at: string };

export async function getInbox(): Promise<{ requests: MaterialRequest[]; subscribers: Subscriber[] }> {
  const supabase = await createClient();
  if (!supabase) return { requests: [], subscribers: [] };
  const [{ data: requests }, { data: subscribers }] = await Promise.all([
    supabase.from("material_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("subscribers").select("*").order("created_at", { ascending: false }),
  ]);
  return { requests: (requests ?? []) as MaterialRequest[], subscribers: (subscribers ?? []) as Subscriber[] };
}

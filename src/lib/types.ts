export type Tone = "done" | "progress" | "blocked" | "upcoming";

export type Vendor = {
  slug: string;
  name: string;
  role: string | null;
  status_label: string | null;
  status_tone: Tone | null;
  detail: string | null;
  cost_label: string | null;
  annual_cost: number | null;
  signed: boolean;
  risk_label: string | null;
  risk_tone: Tone | null;
  risk_points: string[];
  sort: number;
};

export type BoardMember = { name: string; role: string | null; initials: string | null; sort: number };

export type MilestoneStatus = "complete" | "in_progress" | "overdue" | "upcoming" | "deferred";

export type Milestone = {
  id: number;
  date_label: string;
  sort_date: string | null;
  title: string;
  detail: string | null;
  status: MilestoneStatus;
  is_public: boolean;
  public_title: string | null;
  public_note: string | null;
  sort: number;
};

export type ActionStatus = "open" | "in_review" | "blocked" | "overdue" | "not_done" | "done";

export type ActionItem = {
  id: number;
  title: string;
  owner: string | null;
  status: ActionStatus;
  due_date: string | null;
  note: string | null;
  sort: number;
};

export type Resource = {
  id: number;
  section: string | null;
  name: string;
  description: string | null;
  kind: string | null;
  url: string | null;
  sort: number;
};

export type VendorTerm = {
  id: number;
  vendor_slug: string;
  section: string | null;
  term: string;
  detail: string | null;
  risk_level: string | null;
  sort: number;
};

export type NoteKind = "discussion" | "decision" | "action";

export type MeetingNote = { id: number; kind: NoteKind; body: string; owner: string | null; sort: number };

export type Meeting = {
  slug: string;
  date: string;
  title: string;
  subtitle: string | null;
  source_url: string | null;
  notes?: MeetingNote[];
};

export const ACTION_STATUSES: { value: ActionStatus; label: string; tone: Tone }[] = [
  { value: "open", label: "Open", tone: "blocked" },
  { value: "in_review", label: "In Review", tone: "progress" },
  { value: "blocked", label: "Blocked", tone: "blocked" },
  { value: "overdue", label: "Overdue", tone: "blocked" },
  { value: "not_done", label: "Not Done", tone: "blocked" },
  { value: "done", label: "Done", tone: "done" },
];

export const MILESTONE_STATUSES: { value: MilestoneStatus; label: string; tone: Tone }[] = [
  { value: "complete", label: "Complete", tone: "done" },
  { value: "in_progress", label: "In Progress", tone: "progress" },
  { value: "overdue", label: "Overdue", tone: "blocked" },
  { value: "upcoming", label: "Upcoming", tone: "upcoming" },
  { value: "deferred", label: "Deferred", tone: "upcoming" },
];

export const actionStatusMeta = (s: ActionStatus) => ACTION_STATUSES.find((x) => x.value === s)!;
export const milestoneStatusMeta = (s: MilestoneStatus) => MILESTONE_STATUSES.find((x) => x.value === s)!;

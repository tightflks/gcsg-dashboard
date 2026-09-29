"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTION_STATUSES, MILESTONE_STATUSES, type ActionStatus, type MilestoneStatus } from "@/lib/types";

export type FormState = { ok: boolean; message: string } | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NOT_CONFIGURED: FormState = {
  ok: false,
  message: "The database isn't connected yet — add the Supabase environment variables to enable this.",
};

const str = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);

// ── Public ───────────────────────────────────────────────────────────────────

export async function subscribe(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 320).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.from("subscribers").insert({ email });
  if (error && error.code !== "23505") return { ok: false, message: "Something went wrong. Please try again." };
  return { ok: true, message: error ? "You're already subscribed — thanks!" : "Subscribed! We'll email you when this page updates." };
}

export async function requestMaterials(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name", 200);
  const email = str(fd, "email", 320).toLowerCase();
  const organization = str(fd, "organization", 200) || null;
  const message = str(fd, "message", 4000) || null;
  if (!name) return { ok: false, message: "Please add your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.from("material_requests").insert({ name, email, organization, message });
  if (error) return { ok: false, message: "Something went wrong. Please try again." };
  return { ok: true, message: "Thanks — the team will send the donor deck and full proposal shortly." };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const safeNext = (next: string) => (next.startsWith("/") && !next.startsWith("//") ? next : "/admin");

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 320).toLowerCase();
  const password = str(fd, "password", 200);
  const next = safeNext(str(fd, "next", 200) || "/admin");
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };
  const supabase = await createClient();
  if (!supabase) return NOT_CONFIGURED;

  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) return { ok: false, message: "We couldn't send a sign-in link to that address." };
    return { ok: true, message: "Check your inbox — we sent you a sign-in link." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "Incorrect email or password." };
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}

// ── Staff: action items ──────────────────────────────────────────────────────

export type Result = { ok: true } | { ok: false; message: string };
const DEMO: Result = { ok: false, message: "Demo mode is read-only — connect Supabase to save changes." };

function finish(error: { message: string } | null): Result {
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function setActionStatus(id: number, status: ActionStatus): Promise<Result> {
  if (!ACTION_STATUSES.some((s) => s.value === status)) return { ok: false, message: "Invalid status" };
  const supabase = await createClient();
  if (!supabase) return DEMO;
  const { error } = await supabase.from("action_items").update({ status }).eq("id", id);
  return finish(error);
}

export async function saveAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = Number(fd.get("id") ?? 0);
  const row = {
    title: str(fd, "title", 300),
    owner: str(fd, "owner", 120) || null,
    status: (str(fd, "status", 20) || "open") as ActionStatus,
    due_date: str(fd, "due_date", 10) || null,
    note: str(fd, "note", 2000) || null,
  };
  if (!row.title) return { ok: false, message: "Title is required." };
  if (!ACTION_STATUSES.some((s) => s.value === row.status)) return { ok: false, message: "Invalid status." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Demo mode is read-only — connect Supabase to save changes." };
  const { error } = id
    ? await supabase.from("action_items").update(row).eq("id", id)
    : await supabase.from("action_items").insert({ ...row, sort: Date.now() % 2147483647 });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true, message: id ? "Action updated." : "Action added." };
}

export async function deleteAction(id: number): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return DEMO;
  const { error } = await supabase.from("action_items").delete().eq("id", id);
  return finish(error);
}

// ── Staff: timeline ──────────────────────────────────────────────────────────

export async function setMilestoneStatus(id: number, status: MilestoneStatus): Promise<Result> {
  if (!MILESTONE_STATUSES.some((s) => s.value === status)) return { ok: false, message: "Invalid status" };
  const supabase = await createClient();
  if (!supabase) return DEMO;
  const { error } = await supabase.from("milestones").update({ status }).eq("id", id);
  return finish(error);
}

export async function toggleMilestonePublic(id: number, isPublic: boolean): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return DEMO;
  const { error } = await supabase.from("milestones").update({ is_public: isPublic }).eq("id", id);
  return finish(error);
}

// ── Staff: material requests ─────────────────────────────────────────────────

export async function markRequestHandled(id: number, handled: boolean): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return DEMO;
  const { error } = await supabase.from("material_requests").update({ handled }).eq("id", id);
  return finish(error);
}

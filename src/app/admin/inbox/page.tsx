import Link from "next/link";
import { InboxList } from "@/components/admin/InboxList";
import { getInbox, getViewer } from "@/lib/data";

export default async function InboxPage() {
  const [{ requests, subscribers }, viewer] = await Promise.all([getInbox(), getViewer()]);

  return (
    <div className="admin-body">
      <div>
        <Link href="/admin" className="btn-link">← Overview</Link>
        <h1 className="display" style={{ color: "var(--forest-700)", fontSize: 26, fontWeight: 600, marginTop: 8 }}>
          Requests &amp; Subscribers
        </h1>
        <p style={{ color: "var(--ink-4)", fontSize: 13.5, marginTop: 4 }}>
          Submissions from the public page&apos;s “Request Materials” and newsletter forms.
          {viewer?.demo && " (Connect Supabase to collect submissions.)"}
        </p>
      </div>
      <InboxList requests={requests} subscribers={subscribers} />
    </div>
  );
}

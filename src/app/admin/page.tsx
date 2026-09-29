import { Dashboard } from "@/components/admin/Dashboard";
import { getActions, getBoard, getMeetings, getMilestones, getResources, getVendors } from "@/lib/data";

export default async function AdminPage() {
  const [actions, milestones, meetings, resources, vendors, board] = await Promise.all([
    getActions(),
    getMilestones(),
    getMeetings(),
    getResources(),
    getVendors(),
    getBoard(),
  ]);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD

  return (
    <Dashboard
      today={today}
      actions={actions}
      milestones={milestones}
      meetings={meetings}
      resources={resources}
      vendors={vendors}
      boardCount={board.length}
    />
  );
}

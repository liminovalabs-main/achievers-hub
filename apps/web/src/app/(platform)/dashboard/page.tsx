import { apiRequest } from "../../../lib/api";
import { primaryRole, requireUser } from "../../../lib/session";
import { AdminDashboard, ParentDashboard, StudentDashboard, TutorDashboard } from "../../../components/dashboard-views";
import { DashboardShell } from "../../../components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const role = primaryRole(user.roles);
  const [families, links] = await Promise.all([
    role === "PARENT" ? apiRequest<never[]>("/families").catch(() => []) : Promise.resolve([]),
    role === "ADMIN" ? Promise.resolve([]) : apiRequest<never[]>("/relationships").catch(() => []),
  ]);

  return (
    <DashboardShell role={role} userName={user.displayName}>
      {role === "STUDENT" && <StudentDashboard user={user} links={links} />}
      {role === "PARENT" && <ParentDashboard user={user} families={families} links={links} />}
      {role === "TUTOR" && <TutorDashboard user={user} links={links} />}
      {role === "ADMIN" && <AdminDashboard user={user} />}
    </DashboardShell>
  );
}

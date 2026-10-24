import { Suspense } from "react";
import { DashboardShell } from "../../../components/dashboard-shell";
import { OnboardingPanel } from "../../../components/onboarding-panel";
import { primaryRole, requireUser } from "../../../lib/session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const role = primaryRole(user.roles);
  return (
    <DashboardShell role={role} userName={user.displayName}>
      <div className="page-heading"><div><p className="eyebrow">ACCOUNT SETUP</p><h1>Connect your learning circle.</h1><p>Each relationship is explicit, private, and reversible.</p></div><a className="button secondary" href="/dashboard">Return to dashboard</a></div>
      <Suspense fallback={<p>Loading setup…</p>}><OnboardingPanel role={role} /></Suspense>
    </DashboardShell>
  );
}

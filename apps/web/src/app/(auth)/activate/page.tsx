import { Suspense } from "react";
import { ActivateForm } from "../../../components/activate-form";
import { AuthShell } from "../../../components/auth-shell";

export default function ActivatePage() {
  return (
    <AuthShell eyebrow="INVITATION" title="Activate your student account" intro="Create your private sign-in to join your family learning space.">
      <Suspense fallback={<p>Loading invitation…</p>}><ActivateForm /></Suspense>
    </AuthShell>
  );
}

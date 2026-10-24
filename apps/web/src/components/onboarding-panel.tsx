"use client";

import type { Role } from "@achievers-hub/contracts";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserApi } from "../lib/browser-api";

interface Family {
  id: string;
  name: string;
  members: Array<{ role: string; user: { displayName: string; studentProfile?: { id: string } | null } }>;
}

export function OnboardingPanel({ role }: { role: Role }) {
  const router = useRouter();
  const params = useSearchParams();
  const [families, setFamilies] = useState<Family[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role === "PARENT") {
      browserApi<Family[]>("/api/platform/families").then(setFamilies).catch(() => setFamilies([]));
    }
  }, [role]);

  async function run(action: () => Promise<unknown>, success: string | ((result: unknown) => string)) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      setMessage(typeof success === "function" ? success(result) : success);
      if (role === "PARENT") setFamilies(await browserApi<Family[]>("/api/platform/families"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this step");
    } finally { setBusy(false); }
  }

  function values(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return new FormData(event.currentTarget);
  }

  if (role === "ADMIN") return <p>Administrator onboarding is managed through the secure seed and deployment process.</p>;

  return (
    <div className="onboarding-grid">
      {role === "PARENT" && (
        <>
          <form className="setup-card" onSubmit={(event) => { const data = values(event); void run(() => browserApi("/api/platform/families", { method: "POST", body: JSON.stringify({ name: data.get("name") }) }), "Family space created."); }}>
            <span className="step-number">1</span><p className="eyebrow">CREATE FAMILY</p><h2>Name your family space</h2><p className="muted">This private space controls student and tutor relationships.</p>
            <label>Family name<input name="name" placeholder="e.g. The Morgan family" required minLength={2} /></label>
            <button className="button primary" disabled={busy}>Create family</button>
          </form>
          <form className="setup-card" onSubmit={(event) => { const data = values(event); const familyId = String(data.get("familyId")); void run(() => browserApi(`/api/platform/families/${familyId}/student-invitations`, { method: "POST", body: JSON.stringify({ email: data.get("email"), displayName: data.get("displayName") }) }), (result) => `Student invitation created. Share this beta activation path: ${(result as { activationPath: string }).activationPath}`); }}>
            <span className="step-number">2</span><p className="eyebrow">ADD A LEARNER</p><h2>Invite a student</h2><p className="muted">They receive a separate private account; no password is shared.</p>
            <label>Family<select name="familyId" required><option value="">Choose a family</option>{families.map((family) => <option value={family.id} key={family.id}>{family.name}</option>)}</select></label>
            <label>Student name<input name="displayName" required /></label><label>Student email<input name="email" type="email" required /></label>
            <button className="button primary" disabled={busy || !families.length}>Create invitation</button>
          </form>
          <form className="setup-card" onSubmit={(event) => { const data = values(event); void run(() => browserApi("/api/platform/relationships/tutor-invitations", { method: "POST", body: JSON.stringify({ email: data.get("email"), studentId: data.get("studentId") }) }), (result) => `Tutor invitation created. Share this beta invitation path: ${(result as { invitationPath: string }).invitationPath}`); }}>
            <span className="step-number">3</span><p className="eyebrow">AUTHORISE A TUTOR</p><h2>Invite a trusted tutor</h2><p className="muted">Tutor access is scoped to one learner and can be revoked.</p>
            <label>Learner<select name="studentId" required><option value="">Choose a learner</option>{families.flatMap((family) => family.members).filter((member) => member.role === "STUDENT" && member.user.studentProfile).map((member) => <option value={member.user.studentProfile?.id} key={member.user.studentProfile?.id}>{member.user.displayName}</option>)}</select></label>
            <label>Tutor email<input name="email" type="email" required /></label><button className="button primary" disabled={busy}>Invite tutor</button>
          </form>
        </>
      )}
      {role === "STUDENT" && (
        <form className="setup-card wide" onSubmit={(event) => { const data = values(event); void run(() => browserApi("/api/platform/families/student-invitations/accept", { method: "POST", body: JSON.stringify({ token: data.get("token") }) }), "You joined your family learning space."); }}>
          <span className="step-number">1</span><p className="eyebrow">JOIN YOUR FAMILY</p><h2>Accept a family invitation</h2><p className="muted">Paste the invitation token shared by your parent. If your account was created by them, use the activation page instead.</p>
          <label>Invitation token<input name="token" defaultValue={params.get("token") ?? ""} required minLength={32} /></label><button className="button primary" disabled={busy}>Accept invitation</button>
        </form>
      )}
      {role === "TUTOR" && (
        <>
          <form className="setup-card" onSubmit={(event) => { const data = values(event); void run(() => browserApi("/api/platform/relationships/tutor-invitations/accept", { method: "POST", body: JSON.stringify({ token: data.get("token") }) }), "Parent invitation accepted; student access is active."); }}>
            <span className="step-number">1</span><p className="eyebrow">PARENT INVITATION</p><h2>Accept approved access</h2><p className="muted">Use the private invitation sent by a learner’s parent.</p>
            <label>Invitation token<input name="token" defaultValue={params.get("tutorInvite") ?? ""} required minLength={32} /></label><button className="button primary" disabled={busy}>Accept invitation</button>
          </form>
          <form className="setup-card" onSubmit={(event) => { const data = values(event); void run(() => browserApi("/api/platform/relationships/tutor-requests", { method: "POST", body: JSON.stringify({ inviteCode: data.get("inviteCode") }) }), "Request sent. Access remains pending until a parent approves it."); }}>
            <span className="step-number">2</span><p className="eyebrow">REQUEST ACCESS</p><h2>Use a student code</h2><p className="muted">A parent must approve this request before any student information is visible.</p>
            <label>10-character student code<input name="inviteCode" required minLength={10} maxLength={10} /></label><button className="button primary" disabled={busy}>Request access</button>
          </form>
        </>
      )}
      {(message || error) && <div className={error ? "toast error" : "toast success"} role="status">{error || message}</div>}
    </div>
  );
}

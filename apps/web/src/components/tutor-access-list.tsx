"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserApi } from "../lib/browser-api";

interface TutorLink {
  id: string;
  status: string;
  tutor?: { user: { displayName: string; email?: string } };
  student?: { user: { displayName: string; email?: string } };
}

export function TutorAccessList({ links }: { links: TutorLink[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function decide(linkId: string, approved: boolean) {
    setBusyId(linkId); setError("");
    try {
      await browserApi(`/api/platform/relationships/${linkId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update tutor access");
    } finally { setBusyId(""); }
  }

  async function revoke(linkId: string) {
    setBusyId(linkId); setError("");
    try {
      await browserApi(`/api/platform/relationships/${linkId}`, { method: "DELETE" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to revoke tutor access");
    } finally { setBusyId(""); }
  }

  if (!links.length) return <p className="muted">No tutor relationships yet.</p>;

  return (
    <div>
      {links.map((link) => (
        <div className="access-row" key={link.id}>
          <span><strong>{link.tutor?.user.displayName ?? "Tutor"}</strong><small>{link.student?.user.displayName ?? "Learner"} · {link.status.toLowerCase()}</small></span>
          <span className="row-actions">
            {link.status === "PENDING" && <><button disabled={busyId === link.id} onClick={() => decide(link.id, true)}>Approve</button><button className="danger" disabled={busyId === link.id} onClick={() => decide(link.id, false)}>Reject</button></>}
            {link.status === "ACTIVE" && <button className="danger" disabled={busyId === link.id} onClick={() => revoke(link.id)}>Revoke</button>}
          </span>
        </div>
      ))}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

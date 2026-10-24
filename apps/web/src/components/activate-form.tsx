"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { browserApi } from "../lib/browser-api";

export function ActivateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await browserApi("/api/auth/activate", {
        method: "POST",
        body: JSON.stringify({ token: params.get("token") ?? "", password: data.get("password") }),
      });
      router.push("/onboarding");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to activate this account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>Create a password<input name="password" type="password" minLength={12} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? "Activating…" : "Activate account"}</button>
    </form>
  );
}

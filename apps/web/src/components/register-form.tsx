"use client";

import type { Role } from "@achievers-hub/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { browserApi } from "../lib/browser-api";

const choices: Array<{ role: Role; label: string; hint: string }> = [
  { role: "STUDENT", label: "Student", hint: "Build your daily revision plan" },
  { role: "PARENT", label: "Parent", hint: "Support and monitor progress" },
  { role: "TUTOR", label: "Tutor", hint: "Guide approved students" },
];

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await browserApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          displayName: data.get("displayName"),
          role,
        }),
      });
      router.push("/onboarding");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <fieldset className="role-picker">
        <legend>I am joining as</legend>
        {choices.map((choice) => (
          <button
            className={role === choice.role ? "role-choice active" : "role-choice"}
            type="button"
            key={choice.role}
            onClick={() => setRole(choice.role)}
          >
            <strong>{choice.label}</strong><small>{choice.hint}</small>
          </button>
        ))}
      </fieldset>
      <label>Full name<input name="displayName" autoComplete="name" required minLength={2} /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" required minLength={12} /><small>At least 12 characters</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? "Creating account…" : "Continue"}</button>
      <p className="form-foot">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}

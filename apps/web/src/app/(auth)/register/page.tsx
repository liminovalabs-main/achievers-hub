import type { Metadata } from "next";
import { AuthShell } from "../../../components/auth-shell";
import { RegisterForm } from "../../../components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="GET STARTED" title="Create your learning account" intro="Choose your role now; relationships stay controlled and private.">
      <RegisterForm />
    </AuthShell>
  );
}

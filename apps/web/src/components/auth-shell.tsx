import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <BrandMark />
        <div className="auth-story-copy">
          <p className="eyebrow light">ONE COMPLETE GCSE REVISION TOOLKIT</p>
          <h1>Know what to revise next—and why it matters.</h1>
          <p>
            Personalised daily practice, clear grade-gap evidence, and shared progress for learners and the adults supporting them.
          </p>
        </div>
        <div className="trust-row">
          <span>Maths</span><span>Economics</span><span>Parent visibility</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="muted">{intro}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

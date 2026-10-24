"use client";

import type { Role } from "@achievers-hub/contracts";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { browserApi } from "../lib/browser-api";
import { BrandMark } from "./brand-mark";

const navByRole: Record<Role, Array<{ label: string; href: string; icon: string }>> = {
  STUDENT: [
    { label: "Dashboard", href: "/dashboard", icon: "⌂" },
    { label: "Daily 5", href: "/dashboard#daily-five", icon: "☆" },
    { label: "Practice", href: "/dashboard#practice", icon: "✦" },
    { label: "Progress", href: "/dashboard#progress", icon: "↗" },
  ],
  PARENT: [
    { label: "Overview", href: "/dashboard", icon: "⌂" },
    { label: "My learners", href: "/dashboard#learners", icon: "♙" },
    { label: "Tutor access", href: "/dashboard#access", icon: "✓" },
    { label: "Weekly reports", href: "/dashboard#reports", icon: "▥" },
  ],
  TUTOR: [
    { label: "Overview", href: "/dashboard", icon: "⌂" },
    { label: "Students", href: "/dashboard#students", icon: "♙" },
    { label: "Assignments", href: "/dashboard#assignments", icon: "✎" },
    { label: "Progress", href: "/dashboard#progress", icon: "↗" },
  ],
  ADMIN: [
    { label: "Overview", href: "/dashboard", icon: "⌂" },
    { label: "Users", href: "/dashboard#users", icon: "♙" },
    { label: "Content", href: "/dashboard#content", icon: "▤" },
    { label: "Audit trail", href: "/dashboard#audit", icon: "◉" },
  ],
};

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await browserApi("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <BrandMark />
        <nav aria-label="Primary navigation">
          {navByRole[role].map((item, index) => (
            <Link className={pathname === item.href || (index === 0 && pathname === "/dashboard") ? "nav-link active" : "nav-link"} href={item.href} key={item.label}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <Link className="nav-link" href="/onboarding"><span aria-hidden="true">⚙</span>Setup</Link>
        <div className="profile-chip">
          <span className="avatar">{userName.charAt(0).toUpperCase()}</span>
          <span><strong>{userName}</strong><small>{role.toLowerCase()}</small></span>
        </div>
      </aside>
      <section className="dashboard-stage">
        <header className="topbar">
          <div><span className="mobile-brand"><BrandMark compact /></span><strong>{role === "STUDENT" ? "Your learning space" : `${role.charAt(0)}${role.slice(1).toLowerCase()} workspace`}</strong></div>
          <div className="topbar-actions"><span className="status-dot">Foundation live</span><button className="text-button" onClick={signOut}>Sign out</button></div>
        </header>
        <main className="dashboard-content">{children}</main>
      </section>
    </div>
  );
}

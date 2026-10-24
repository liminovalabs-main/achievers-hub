import type { CurrentUser } from "../lib/session";
import { StatCard } from "./stat-card";
import { TutorAccessList } from "./tutor-access-list";

interface FamilyRecord {
  id: string;
  name: string;
  members: Array<{
    role: "PARENT" | "STUDENT";
    user: {
      id: string;
      displayName: string;
      email: string;
      status: string;
      onboardingComplete: boolean;
      studentProfile?: { id: string; inviteCode: string } | null;
    };
  }>;
  invitations: Array<{ id: string; type: string; email: string; expiresAt: string }>;
}

interface TutorLink {
  id: string;
  status: string;
  tutor?: { user: { displayName: string; email?: string } };
  student?: { user: { displayName: string; email?: string } };
}

function Greeting({ user, copy }: { user: CurrentUser; copy: string }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">YOUR OVERVIEW</p><h1>Welcome back, {user.displayName.split(" ")[0]}.</h1><p>{copy}</p></div>
      <span className="role-badge">{user.roles.join(" + ").toLowerCase()}</span>
    </div>
  );
}

export function StudentDashboard({ user, links }: { user: CurrentUser; links: TutorLink[] }) {
  return (
    <>
      <Greeting user={user} copy="Your setup is ready. Learning content and Daily 5 arrive in the next delivery slice." />
      <section className="hero-card" id="daily-five">
        <div><p className="eyebrow orange">YOUR NEXT STEP</p><h2>Set your working and target grades.</h2><p>This will help Daily 5 choose practice at the right level when the learning engine is enabled.</p></div>
        <a className="button dark" href="/onboarding">Complete setup <span>→</span></a>
      </section>
      <section className="stats-grid" id="progress">
        <StatCard label="Working grade" value={user.studentProfile?.currentGrade ?? "Not set"} helper="Where you are now" />
        <StatCard label="Target grade" value={user.studentProfile?.targetGrade ?? "Not set"} helper="Where you are aiming" />
        <StatCard label="Approved tutors" value={String(links.filter((link) => link.status === "ACTIVE").length)} helper="Controlled by your parent" />
        <StatCard label="Learning streak" value="0" helper="Starts with Daily 5" />
      </section>
      <section className="two-column" id="practice">
        <article className="panel"><p className="eyebrow">STUDENT INVITE CODE</p><h3>{user.studentProfile?.inviteCode ?? "Pending"}</h3><p className="muted">Only share this code with a tutor you know. A parent must approve every request.</p></article>
        <article className="panel"><p className="eyebrow">PRIVACY BY DEFAULT</p><h3>Your learning data stays controlled.</h3><p className="muted">Tutors see your workspace only through an active, parent-approved relationship.</p></article>
      </section>
    </>
  );
}

export function ParentDashboard({ user, families, links }: { user: CurrentUser; families: FamilyRecord[]; links: TutorLink[] }) {
  const students = families.flatMap((family) => family.members.filter((member) => member.role === "STUDENT"));
  const pending = links.filter((link) => link.status === "PENDING");
  return (
    <>
      <Greeting user={user} copy="See who is connected, what needs approval, and whether setup is complete." />
      <section className="hero-card parent-hero">
        <div><p className="eyebrow orange">FAMILY CONTROL CENTRE</p><h2>{students.length ? `${students.length} learner${students.length === 1 ? "" : "s"} connected` : "Add your first learner"}</h2><p>Family links and tutor access are enforced in the API, not just hidden in the interface.</p></div>
        <a className="button dark" href="/onboarding">Manage family <span>→</span></a>
      </section>
      <section className="stats-grid">
        <StatCard label="Families" value={String(families.length)} helper="Spaces you manage" />
        <StatCard label="Learners" value={String(students.length)} helper="Linked students" />
        <StatCard label="Pending approvals" value={String(pending.length)} helper="Tutor requests to review" />
        <StatCard label="Weekly reports" value="Soon" helper="Next delivery slice" />
      </section>
      <section className="two-column" id="learners">
        <article className="panel"><p className="eyebrow">MY LEARNERS</p><h3>{students.length ? "Family setup in progress" : "No learners linked yet"}</h3>{students.map(({ user: student }) => <div className="list-row" key={student.id}><span className="avatar small">{student.displayName.charAt(0)}</span><span><strong>{student.displayName}</strong><small>{student.status.toLowerCase()}</small></span></div>)}{!students.length && <p className="muted">Invite a student from setup to create their private account.</p>}</article>
        <article className="panel" id="access"><p className="eyebrow">TUTOR ACCESS</p><h3>{pending.length ? `${pending.length} request${pending.length === 1 ? "" : "s"} need attention` : "Tutor permissions"}</h3><p className="muted">Access remains unavailable until you explicitly approve it.</p><TutorAccessList links={links} /></article>
      </section>
    </>
  );
}

export function TutorDashboard({ user, links }: { user: CurrentUser; links: TutorLink[] }) {
  const active = links.filter((link) => link.status === "ACTIVE");
  return (
    <>
      <Greeting user={user} copy="Your roster contains only students with an active, parent-approved connection." />
      <section className="hero-card tutor-hero">
        <div><p className="eyebrow orange">BUILD YOUR ROSTER</p><h2>{active.length ? `${active.length} active student${active.length === 1 ? "" : "s"}` : "Connect your first student"}</h2><p>Use a student invite code or accept an invitation sent by their parent.</p></div>
        <a className="button dark" href="/onboarding">Add a student <span>→</span></a>
      </section>
      <section className="stats-grid">
        <StatCard label="Active students" value={String(active.length)} helper="Approved access" />
        <StatCard label="Pending requests" value={String(links.filter((link) => link.status === "PENDING").length)} helper="Awaiting a parent" />
        <StatCard label="Assignments" value="0" helper="Enabled in the learning slice" />
        <StatCard label="Reports reviewed" value="0" helper="This week" />
      </section>
      <section className="panel" id="students"><p className="eyebrow">STUDENT ROSTER</p><h3>{active.length ? "Approved learners" : "Your roster is empty"}</h3>{active.map((link) => <div className="list-row" key={link.id}><span className="avatar small">{link.student?.user.displayName.charAt(0)}</span><span><strong>{link.student?.user.displayName}</strong><small>Access active</small></span></div>)}{!active.length && <p className="muted">Connections appear here after the parent approval flow completes.</p>}</section>
    </>
  );
}

export function AdminDashboard({ user }: { user: CurrentUser }) {
  return (
    <>
      <Greeting user={user} copy="The operational foundation is ready for content administration and launch telemetry." />
      <section className="hero-card admin-hero"><div><p className="eyebrow orange">PLATFORM FOUNDATION</p><h2>Identity and access controls are online.</h2><p>Content publishing, learner support, and detailed health metrics follow in the next delivery slices.</p></div><span className="button dark static">Day 1–4 complete</span></section>
      <section className="stats-grid"><StatCard label="Authentication" value="Ready" helper="JWT + server cookie" /><StatCard label="Role isolation" value="4 roles" helper="API enforced" /><StatCard label="Relationships" value="Audited" helper="Parent controlled" /><StatCard label="Platform health" value="Online" helper="Health endpoint active" /></section>
      <section className="two-column"><article className="panel" id="users"><p className="eyebrow">USER OPERATIONS</p><h3>Account support foundation</h3><p className="muted">User search and suspension controls are scheduled with the admin content tools.</p></article><article className="panel" id="audit"><p className="eyebrow">AUDIT TRAIL</p><h3>Security events are recorded</h3><p className="muted">Registration, family creation, invitations, approvals, rejection, and revocation are persisted.</p></article></section>
    </>
  );
}

export function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span><strong>{value}</strong><small>{helper}</small>
    </article>
  );
}

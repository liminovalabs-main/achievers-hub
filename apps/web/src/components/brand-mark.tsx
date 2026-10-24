export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="The Achievers Hub">
      <span className="brand-symbol" aria-hidden="true">◆</span>
      {!compact && (
        <span>
          <strong>ACHIEVERS HUB</strong>
          <small>LEARN. ACHIEVE. GROW.</small>
        </span>
      )}
    </div>
  );
}

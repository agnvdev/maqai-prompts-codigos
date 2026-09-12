export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium tracking-tight text-muted">
      {children}
    </span>
  );
}

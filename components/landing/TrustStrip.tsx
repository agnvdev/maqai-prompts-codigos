export function TrustStrip() {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-1.5 px-4 py-4 text-center text-xs font-bold uppercase tracking-widest sm:px-6">
        <span className="text-accent">Testados.</span>
        <span className="text-foreground">Validados.</span>
        <span className="text-foreground">Em uso real.</span>
      </div>
    </section>
  );
}

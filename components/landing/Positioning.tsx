export function Positioning() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Feito para o setor pesado, não para todo mundo
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          A MaqDesk não tenta atender qualquer nicho. Cada prompt é pensado para máquinas pesadas,
          agro, mineração e equipamentos pesados, com foco e validação nesse setor.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs font-bold uppercase tracking-widest">
          <span className="text-accent">Testados.</span>
          <span className="text-foreground">Validados.</span>
          <span className="text-foreground">Em uso real.</span>
        </div>
      </div>
    </section>
  );
}

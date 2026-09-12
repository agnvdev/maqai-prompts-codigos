const steps = [
  {
    number: "01",
    title: "Escolha",
    description: "Encontre o prompt certo por busca, categoria ou segmento da sua máquina.",
  },
  {
    number: "02",
    title: "Copie",
    description: "Um toque copia o prompt completo, pronto para uso, sem precisar editar nada.",
  },
  {
    number: "03",
    title: "Cole na IA",
    description: "Cole na sua ferramenta de IA favorita e gere o resultado em segundos.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Como funciona
        </h2>

        <div className="relative mt-14 grid grid-cols-1 gap-9 sm:grid-cols-3 sm:gap-6">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-border sm:hidden" />
          <div className="pointer-events-none absolute inset-x-0 top-5 hidden h-px bg-border sm:block" />

          {steps.map((step) => (
            <div key={step.number} className="relative flex gap-4 sm:flex-col sm:gap-5">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-surface text-sm font-bold text-accent shadow-card">
                {step.number}
              </div>
              <div className="flex flex-col gap-1.5 pt-1.5 sm:pt-1">
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="max-w-[240px] text-sm leading-relaxed text-muted sm:max-w-none">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

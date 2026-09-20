const benefits = [
  {
    title: "Copiar e colar, sem editar",
    description:
      "Cada prompt já vem pronto para a sua ferramenta de IA. Sem ajustar parâmetros, sem tentativa e erro.",
  },
  {
    title: "Focado no setor pesado",
    description:
      "Máquinas pesadas, agro, mineração e equipamentos pesados. Não é conteúdo genérico adaptado às pressas.",
  },
  {
    title: "Atualização constante",
    description: "Novos prompts e tendências adicionados o tempo todo, sem custo adicional na assinatura.",
  },
  {
    title: "Testado antes de publicar",
    description:
      "Prompts marcados como testados foram validados em uso real antes de entrar na biblioteca.",
  },
] as const;

export function Benefits() {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Por que assinar a MaqDesk
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          {benefits.map((benefit, i) => (
            <div key={benefit.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-foreground">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

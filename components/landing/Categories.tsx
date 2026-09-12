const categories = [
  "Essenciais",
  "Máquinas",
  "Agro",
  "Mineração",
  "Imagem",
  "Vídeo",
  "Instagram",
  "Vendas",
  "Códigos",
  "Combos",
];

export function Categories() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Categorias
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Filtre a biblioteca do jeito que quiser, direto na tela de prompts.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:border-accent/40 hover:text-foreground"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

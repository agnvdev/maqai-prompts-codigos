import Image from "next/image";
import { SEGMENT_IMAGES } from "@/lib/images";

const segments = [
  {
    title: "Máquinas Pesadas",
    description: "Escavadeiras, tratores, caminhões e implementos em cenas de alto impacto.",
  },
  {
    title: "Agro",
    description: "Colheitadeiras, plantio e operações no campo em conteúdo premium.",
  },
  {
    title: "Mineração",
    description: "Operações de grande escala, caminhões fora de estrada e frentes de lavra.",
  },
] as const;

export function Segments({ imageOverrides = {} }: { imageOverrides?: Record<string, string> }) {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Segmentos
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
          {segments.map((segment, i) => (
            <div
              key={segment.title}
              className={
                i === 0
                  ? "group relative flex flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-accent/25 p-7 shadow-card sm:row-span-2 sm:p-9"
                  : "group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border p-6 shadow-card transition-colors hover:border-accent/30"
              }
            >
              <Image
                src={imageOverrides[segment.title] || SEGMENT_IMAGES[segment.title]}
                alt={segment.title}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/35" />
              {i === 0 && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgba(245,197,24,0.14),transparent_65%)]" />
              )}
              <h3
                className={
                  i === 0
                    ? "relative z-10 text-2xl font-bold text-accent sm:text-[28px]"
                    : "relative z-10 text-lg font-bold text-accent"
                }
              >
                {segment.title}
              </h3>
              <p
                className={
                  i === 0
                    ? "relative z-10 max-w-[26ch] text-sm leading-relaxed text-muted sm:text-base"
                    : "relative z-10 text-sm leading-relaxed text-muted"
                }
              >
                {segment.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

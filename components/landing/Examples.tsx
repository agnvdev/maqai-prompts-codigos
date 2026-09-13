import Image from "next/image";
import Link from "next/link";
import { prompts } from "@/data/prompts";
import { SEGMENT_IMAGES } from "@/lib/images";
import { TypeIcon } from "@/components/library/TypeIcon";

export function Examples({ imageOverrides = {} }: { imageOverrides?: Record<string, string> }) {
  const examples = prompts.filter((p) => p.featured).slice(0, 6);

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Exemplos de prompts
          </h2>
          <p className="max-w-xl text-sm text-muted">
            Uma pequena amostra do que você encontra na biblioteca completa.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((prompt) => (
            <div
              key={prompt.id}
              className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2"
            >
              <div className="relative -mx-5 -mt-5 h-36 overflow-hidden">
                <Image
                  src={imageOverrides[prompt.segment] || SEGMENT_IMAGES[prompt.segment]}
                  alt={prompt.segment}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] font-medium text-accent transition-colors group-hover:bg-background">
                <TypeIcon type={prompt.type} className="h-3.5 w-3.5" />
                {prompt.code}
              </span>
              <h3 className="text-[15px] font-semibold text-foreground">{prompt.title}</h3>
              <p className="line-clamp-2 text-[13px] leading-snug text-muted">
                {prompt.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/app"
            className="rounded-lg border border-accent px-6 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
          >
            Ver todos os prompts
          </Link>
        </div>
      </div>
    </section>
  );
}

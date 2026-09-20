import Image from "next/image";
import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";

export function BeforeAfter({ pairs }: { pairs: LpBeforeAfterPair[] }) {
  if (pairs.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Antes e depois
          </h2>
          <p className="max-w-xl text-sm text-muted">
            Resultados reais gerados a partir dos prompts da biblioteca.
          </p>
        </div>

        <div
          className="no-scrollbar mt-10 flex gap-4 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible lg:grid-cols-3"
        >
          {pairs.map((pair) => (
            <div
              key={pair.id}
              className="flex w-[240px] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card sm:w-full"
            >
              <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={pair.before_image_url}
                    alt="Antes"
                    fill
                    sizes="(min-width: 640px) 200px, 115px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-sm">
                    Antes
                  </span>
                </div>
                <div className="relative aspect-[3/4]">
                  <Image
                    src={pair.after_image_url}
                    alt="Depois"
                    fill
                    sizes="(min-width: 640px) 200px, 115px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                    Depois
                  </span>
                </div>
              </div>

              {pair.prompt_code && (
                <span className="w-fit rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] font-medium text-accent">
                  {pair.prompt_code}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

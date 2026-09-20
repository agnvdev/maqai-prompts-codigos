import Image from "next/image";
import type { LpShowcaseItem } from "@/lib/supabase/lpShowcase";

// Only ever image + title + optional segment - never a prompt code,
// prompt name, or prompt_text. /app is the only place that shows real
// catalog cards.
export function Showcase({ items }: { items: LpShowcaseItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Resultados que você pode criar com a MaqDesk
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border shadow-card">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 23vw, (min-width: 640px) 30vw, 45vw"
                  className="object-cover"
                />
                {item.segment && (
                  <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-sm">
                    {item.segment}
                  </span>
                )}
              </div>
              <span className="px-0.5 text-sm font-medium text-foreground">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

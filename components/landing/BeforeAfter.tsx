import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import { BeforeAfterSlider } from "@/components/landing/BeforeAfterSlider";

export function BeforeAfter({ pairs }: { pairs: LpBeforeAfterPair[] }) {
  if (pairs.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Veja a transformação na prática
          </h2>
          <p className="max-w-xl text-sm text-muted">Arraste para comparar antes e depois.</p>
        </div>

        <div className="no-scrollbar mt-10 flex gap-4 overflow-x-auto px-1 pb-2 sm:justify-center sm:flex-wrap">
          {pairs.map((pair) => (
            <BeforeAfterSlider
              key={pair.id}
              beforeUrl={pair.before_image_url}
              afterUrl={pair.after_image_url}
              title={pair.title ?? undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

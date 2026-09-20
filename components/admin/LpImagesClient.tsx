import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import { SEGMENTS } from "@/lib/taxonomy";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";

// Examples.tsx keys its background by prompt.segment (any SEGMENTS
// value); Segments.tsx only ever renders these 3 specific cards.
const EXAMPLE_IDENTIFIERS = SEGMENTS;
const SEGMENT_CARD_IDENTIFIERS = ["Máquinas Pesadas", "Agro", "Mineração"] as const;

function findImage(items: LpMediaRow[], slot: string, identifier: string) {
  const row = items.find((item) => item.slot === slot && item.identifier === identifier);
  return { imageUrl: row?.image_url ?? null, rowId: row?.id };
}

export function LpImagesClient({ items }: { items: LpMediaRow[] }) {
  const hero = findImage(items, "hero", "hero");
  const finalCta = findImage(items, "final_cta", "final_cta");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Imagens da landing page</h1>
        <p className="text-xs text-muted">
          Cada imagem já sabe onde vai na página — é só enviar, sem escolher slot ou digitar
          identificador.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">Hero</h2>
          <p className="text-xs text-muted">Imagem de fundo da seção principal, no topo da página.</p>
          <p className="text-xs text-muted">Dimensão recomendada: 1920×1080 (16:9) ou maior.</p>
          <LpImageUploadSlot
            slot="hero"
            identifier="hero"
            label="Hero"
            imageUrl={hero.imageUrl}
            rowId={hero.rowId}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-foreground">CTA final</h2>
          <p className="text-xs text-muted">
            Reservado para a imagem de fundo da seção final de call-to-action.
          </p>
          <p className="text-xs text-muted">
            Dimensão recomendada: 1920×1080 (16:9). Ainda não exibida publicamente.
          </p>
          <LpImageUploadSlot
            slot="final_cta"
            identifier="final_cta"
            label="CTA final"
            imageUrl={finalCta.imageUrl}
            rowId={finalCta.rowId}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:col-span-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Exemplos</h2>
            <p className="text-xs text-muted">Foto de fundo dos cards de exemplo de prompts, por segmento.</p>
            <p className="text-xs text-muted">Dimensão recomendada: 1600×900 (16:9).</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAMPLE_IDENTIFIERS.map((segment) => {
              const { imageUrl, rowId } = findImage(items, "examples", segment);
              return (
                <LpImageUploadSlot
                  key={segment}
                  slot="examples"
                  identifier={segment}
                  label={segment}
                  imageUrl={imageUrl}
                  rowId={rowId}
                />
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:col-span-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Segmentos</h2>
            <p className="text-xs text-muted">
              Foto de fundo dos 3 cards de segmento na página inicial (Máquinas Pesadas, Agro,
              Mineração).
            </p>
            <p className="text-xs text-muted">
              Dimensão recomendada: 1200×1500 (4:5, retrato) ou maior — a imagem é cortada.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SEGMENT_CARD_IDENTIFIERS.map((segment) => {
              const { imageUrl, rowId } = findImage(items, "segments", segment);
              return (
                <LpImageUploadSlot
                  key={segment}
                  slot="segments"
                  identifier={segment}
                  label={segment}
                  imageUrl={imageUrl}
                  rowId={rowId}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

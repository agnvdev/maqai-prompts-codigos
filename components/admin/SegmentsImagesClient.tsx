import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import { LP_SEGMENTS } from "@/lib/images";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";

function findImage(items: LpMediaRow[], slot: string, identifier: string) {
  const row = items.find((item) => item.slot === slot && item.identifier === identifier);
  return { imageUrl: row?.image_url ?? null, rowId: row?.id };
}

export function SegmentsImagesClient({ items }: { items: LpMediaRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-lg font-bold text-foreground">Segmentos</h1>
        <p className="text-xs text-muted">
          Foto de fundo dos 4 cards de segmento na página inicial (Máquinas Pesadas, Agro,
          Mineração, Equipamentos Pesados).
        </p>
        <p className="text-xs text-muted">
          Dimensão recomendada: 1200×1500 (4:5, retrato) ou maior - a imagem é cortada.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LP_SEGMENTS.map((segment) => {
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
  );
}

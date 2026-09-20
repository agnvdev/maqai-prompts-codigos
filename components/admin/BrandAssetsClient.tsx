import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";

function findImage(items: LpMediaRow[], slot: string, identifier: string) {
  const row = items.find((item) => item.slot === slot && item.identifier === identifier);
  return { imageUrl: row?.image_url ?? null, rowId: row?.id };
}

export function BrandAssetsClient({ items }: { items: LpMediaRow[] }) {
  const logo = findImage(items, "logo", "Logo");
  const assets = findImage(items, "logo", "Assets");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Marca</h1>
        <p className="text-xs text-muted">
          Reservado para logo/assets em imagem. Dimensão recomendada: 512×512 (quadrado) ou SVG.
          Ainda não exibido publicamente — a marca hoje usa só texto (&quot;MaqDesk&quot;).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LpImageUploadSlot
          slot="logo"
          identifier="Logo"
          label="Logo"
          imageUrl={logo.imageUrl}
          rowId={logo.rowId}
        />
        <LpImageUploadSlot
          slot="logo"
          identifier="Assets"
          label="Assets"
          imageUrl={assets.imageUrl}
          rowId={assets.rowId}
        />
      </div>
    </div>
  );
}

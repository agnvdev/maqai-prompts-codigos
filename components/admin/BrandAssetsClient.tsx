import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";

function findImage(items: LpMediaRow[], slot: string, identifier: string) {
  const row = items.find((item) => item.slot === slot && item.identifier === identifier);
  return { imageUrl: row?.image_url ?? null, rowId: row?.id };
}

// "Assets" (slot logo/identifier Assets) used to be editable here too,
// but nothing in the app ever reads it - audited and hidden per OPER
// "Reorganizar Mídias da LP" (its lp_media row, if any, is left as-is;
// only the dead editor UI for it was removed).
export function BrandAssetsClient({ items }: { items: LpMediaRow[] }) {
  const logo = findImage(items, "logo", "Logo");

  return (
    <div className="max-w-xs">
      <LpImageUploadSlot
        slot="logo"
        identifier="Logo"
        label="Logo"
        imageUrl={logo.imageUrl}
        rowId={logo.rowId}
        whereUsed="Cabeçalho e rodapé da página inicial, cabeçalho do /app, login e demais páginas de autenticação."
        dimension="512×512 (quadrado) ou SVG."
      />
    </div>
  );
}

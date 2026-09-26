// Temporary page for OPER "Aplicar rewrite dos 312 pelo admin com
// segurança" - remove alongside app/admin/rewrite-imagem-actions.ts,
// components/admin/RewriteImagemPanel.tsx and the AdminHeader nav entry
// once the 312-row rewrite is confirmed applied in production.

import { validateImagemRewriteAction } from "@/app/admin/rewrite-imagem-actions";
import { RewriteImagemPanel } from "@/components/admin/RewriteImagemPanel";

export default async function RewriteImagemPage() {
  const validation = await validateImagemRewriteAction();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Aplicar rewrite dos prompts de Imagem</h1>
        <p className="text-xs leading-relaxed text-muted">
          Ação temporária: atualiza somente prompt_text dos 312 prompts type=Imagem a partir de
          rewrite-imagem-edit-maqai.json, usando a sessão admin atual (RLS respeitada, sem service role) -
          substitui a necessidade de colar supabase/rewrite-imagem-edit-maqai.sql manualmente no Supabase SQL
          Editor.
        </p>
      </div>
      <RewriteImagemPanel initialValidation={validation} />
    </div>
  );
}

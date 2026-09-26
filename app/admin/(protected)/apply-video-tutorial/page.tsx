// Temporary page for OPER "Implementar tutoriais dos 152 vídeos" -
// remove alongside app/admin/tutorial-video-actions.ts,
// components/admin/VideoTutorialPanel.tsx,
// components/admin/BrandingFixPanel.tsx and the AdminHeader nav entry
// once both are confirmed applied in production.

import { validateVideoTutorialAction, validateBrandingFixAction } from "@/app/admin/tutorial-video-actions";
import { VideoTutorialPanel } from "@/components/admin/VideoTutorialPanel";
import { BrandingFixPanel } from "@/components/admin/BrandingFixPanel";

export default async function ApplyVideoTutorialPage() {
  const [tutorialValidation, brandingValidation] = await Promise.all([
    validateVideoTutorialAction(),
    validateBrandingFixAction(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-bold text-foreground">Aplicar tutoriais dos prompts de Vídeo</h1>
        <p className="text-xs leading-relaxed text-muted">
          Ação temporária: grava tutorial_data (objetivo, passos, configuração e resultado) nos 152 prompts
          type=Vídeo a partir de rewrite-video-tutorial-maqai.json, e corrige o branding MaqDesk → MaqAI nos 20
          /vendavid* que ainda mencionam o nome antigo. Usa a sessão admin atual (RLS respeitada, sem service
          role).
        </p>
      </div>

      <VideoTutorialPanel initialValidation={tutorialValidation} />
      <BrandingFixPanel initialValidation={brandingValidation} />
    </div>
  );
}

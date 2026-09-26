"use client";

// Temporary panel, part of OPER "Implementar tutoriais dos 152 vídeos" -
// see app/admin/tutorial-video-actions.ts. Remove alongside that file.

import { useState } from "react";
import {
  applyBrandingFixAction,
  validateBrandingFixAction,
  type ApplyResult,
  type BrandingValidation,
} from "@/app/admin/tutorial-video-actions";

export function BrandingFixPanel({ initialValidation }: { initialValidation: BrandingValidation }) {
  const [validation, setValidation] = useState(initialValidation);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setApplying(true);
    try {
      const result = await applyBrandingFixAction();
      setApplyResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao corrigir o branding.");
    } finally {
      setApplying(false);
    }
  }

  async function handleRecheck() {
    setError(null);
    try {
      setValidation(await validateBrandingFixAction());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao revalidar.");
    }
  }

  if (!validation.ok && !applyResult) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-4">
        <h2 className="text-sm font-bold text-foreground">Branding MaqDesk → MaqAI (20 vídeos)</h2>
        {validation.missingInDb.length === 0 && validation.stillHasMaqdesk.length === validation.total ? (
          <>
            <p className="text-xs text-muted">
              {validation.stillHasMaqdesk.length} de {validation.total} ainda mencionam &quot;MaqDesk&quot; em
              title/description/prompt_text.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={applying}
              className="w-fit rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
            >
              {applying ? "Corrigindo..." : `Corrigir ${validation.stillHasMaqdesk.length} prompts`}
            </button>
          </>
        ) : (
          <ul className="flex flex-col gap-1 text-xs text-red-400">
            {validation.missingInDb.length > 0 && <li>Codes ausentes no banco: {validation.missingInDb.join(", ")}</li>}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-4">
      <h2 className="text-sm font-bold text-foreground">Branding MaqDesk → MaqAI (20 vídeos)</h2>

      {applyResult && (
        <div className="rounded-xl border border-border bg-surface p-3 text-xs text-foreground">
          Tentados: <span className="font-semibold">{applyResult.attempted}</span> · Corrigidos:{" "}
          <span className="font-semibold text-accent">{applyResult.updated}</span> · Erros:{" "}
          <span className="font-semibold text-red-400">{applyResult.errors.length}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleRecheck}
        className="w-fit rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
      >
        Revalidar
      </button>

      {validation.ok && <p className="text-xs font-semibold text-accent">0 prompts ainda mencionam MaqDesk.</p>}
    </div>
  );
}

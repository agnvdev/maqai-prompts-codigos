"use client";

// Temporary panel for OPER "Implementar tutoriais dos 152 vídeos" - see
// app/admin/tutorial-video-actions.ts. Remove alongside that file, its
// page and the nav entry once both the tutorial rewrite and the
// branding fix are confirmed applied in production.

import { useState } from "react";
import {
  applyVideoTutorialAction,
  postValidateVideoTutorialAction,
  type ApplyResult,
  type PostValidation,
  type TutorialValidation,
} from "@/app/admin/tutorial-video-actions";

type Step = "idle" | "applying" | "applied" | "checking" | "checked";

export function VideoTutorialPanel({ initialValidation }: { initialValidation: TutorialValidation }) {
  const [step, setStep] = useState<Step>("idle");
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [postValidation, setPostValidation] = useState<PostValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const v = initialValidation;

  async function handleConfirm() {
    setError(null);
    setStep("applying");
    try {
      const result = await applyVideoTutorialAction();
      setApplyResult(result);
      setStep("applied");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao aplicar os tutoriais.");
      setStep("idle");
    }
  }

  async function handleCheck() {
    setError(null);
    setStep("checking");
    try {
      const result = await postValidateVideoTutorialAction();
      setPostValidation(result);
      setStep("checked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao validar o resultado.");
      setStep("applied");
    }
  }

  if (!v.ok) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <h2 className="text-sm font-bold text-red-400">Pré-validação falhou - execução bloqueada</h2>
        <ul className="flex flex-col gap-1 text-xs text-red-400">
          {v.total !== 152 && <li>Total no arquivo: {v.total} (esperado 152)</li>}
          {v.uniqueCodes !== v.total && (
            <li>
              Codes únicos: {v.uniqueCodes} de {v.total}
            </li>
          )}
          {v.duplicateCodesInFile.length > 0 && (
            <li>Codes duplicados no arquivo: {v.duplicateCodesInFile.join(", ")}</li>
          )}
          {v.missingInDb.length > 0 && <li>Codes ausentes no banco: {v.missingInDb.join(", ")}</li>}
          {v.notVideo.length > 0 && <li>Codes que não são type=Vídeo no banco: {v.notVideo.join(", ")}</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/40 p-4">
      <div className="flex flex-col gap-1 text-xs text-foreground">
        <p>
          <span className="font-semibold text-accent">{v.total}</span> prompts de Vídeo encontrados e validados em
          rewrite-video-tutorial-maqai.json.
        </p>
        <p>
          <span className="font-semibold text-accent">{v.total}</span> receberão{" "}
          <code className="rounded bg-surface px-1">tutorial_data</code>. Nenhum outro campo é alterado.
        </p>
        <p className="text-muted">prompt_text, title, description, tools, category_id, segment e demais campos não são tocados.</p>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</p>}

      {step === "idle" && (
        <button
          type="button"
          onClick={handleConfirm}
          className="w-fit rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground transition-transform duration-200 active:scale-[0.98]"
        >
          Confirmar atualização dos {v.total}
        </button>
      )}

      {step === "applying" && <p className="text-xs font-semibold text-muted">Atualizando... não feche esta página.</p>}

      {applyResult && (
        <div className="rounded-xl border border-border bg-surface p-3 text-xs text-foreground">
          Tentados: <span className="font-semibold">{applyResult.attempted}</span> · Atualizados:{" "}
          <span className="font-semibold text-accent">{applyResult.updated}</span> · Erros:{" "}
          <span className="font-semibold text-red-400">{applyResult.errors.length}</span>
          {applyResult.errors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-red-400">
              {applyResult.errors.map((e) => (
                <li key={e.code}>
                  {e.code}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(step === "applied" || step === "checking" || step === "checked") && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={step === "checking"}
          className="w-fit rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors duration-200 disabled:opacity-60"
        >
          {step === "checking" ? "Validando..." : "Rodar pós-validação"}
        </button>
      )}

      {postValidation && (
        <div
          className={`rounded-xl border p-3 text-xs text-foreground ${
            postValidation.ok ? "border-accent/40 bg-accent/10" : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <p className="font-bold">{postValidation.ok ? "Pós-validação OK" : "Pós-validação com pendências"}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            <li>Codes verificados: {postValidation.checkedCodes} / 152</li>
            <li>type=Vídeo: {postValidation.totalVideo} / 152</li>
            <li>Com tutorial_data: {postValidation.withTutorialData} / 152</li>
            <li>
              Com objetivo, passos, configuração e resultado preenchidos: {postValidation.withGoalStepsSettingsResult}{" "}
              / 152
            </li>
            <li>prompt_text intacto (não tocado por esta ação): sim</li>
          </ul>
        </div>
      )}
    </div>
  );
}

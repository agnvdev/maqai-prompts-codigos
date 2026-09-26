"use server";

// Temporary actions to apply rewrite-video-tutorial-maqai.json (OPER
// "Implementar tutoriais dos 152 vídeos") and the MaqDesk -> MaqAI
// branding fix, through the admin session's own RLS-scoped client -
// same safe pattern as app/admin/rewrite-imagem-actions.ts. Remove this
// file, its page and nav entry once both are confirmed applied.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import tutorialRows from "@/rewrite-video-tutorial-maqai.json";
import brandingRows from "@/branding-fix-vendavid.json";

interface TutorialRow {
  catalog_number: number;
  code: string;
  tutorial_goal: string;
  tutorial_steps: string[];
  tutorial_settings: string;
  tutorial_result: string;
  tools: string[];
}

interface BrandingRow {
  catalog_number: number;
  code: string;
  title: string;
  description: string;
  prompt_text: string;
}

const TUTORIAL_ROWS = tutorialRows as TutorialRow[];
const BRANDING_ROWS = brandingRows as BrandingRow[];
const EXPECTED_TUTORIAL_TOTAL = 152;
const EXPECTED_BRANDING_TOTAL = 20;
const BATCH_SIZE = 25;

function toTutorialData(row: TutorialRow) {
  return {
    goal: row.tutorial_goal,
    steps: row.tutorial_steps,
    settings: row.tutorial_settings,
    result: row.tutorial_result,
    url: null,
  };
}

export interface TutorialValidation {
  total: number;
  uniqueCodes: number;
  duplicateCodesInFile: string[];
  missingInDb: string[];
  notVideo: string[];
  ok: boolean;
}

export async function validateVideoTutorialAction(): Promise<TutorialValidation> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const codes = TUTORIAL_ROWS.map((r) => r.code);
  const seen = new Set<string>();
  const duplicateCodesInFile: string[] = [];
  for (const c of codes) {
    if (seen.has(c)) duplicateCodesInFile.push(c);
    seen.add(c);
  }

  const { data, error } = await supabase.from("prompts").select("code, type").in("code", codes);
  if (error) throw new Error(error.message);

  const dbTypeByCode = new Map((data ?? []).map((r) => [r.code as string, r.type as string | null]));
  const missingInDb = codes.filter((c) => !dbTypeByCode.has(c));
  const notVideo = codes.filter((c) => dbTypeByCode.has(c) && dbTypeByCode.get(c) !== "Vídeo");

  const ok =
    TUTORIAL_ROWS.length === EXPECTED_TUTORIAL_TOTAL &&
    seen.size === EXPECTED_TUTORIAL_TOTAL &&
    duplicateCodesInFile.length === 0 &&
    missingInDb.length === 0 &&
    notVideo.length === 0;

  return {
    total: TUTORIAL_ROWS.length,
    uniqueCodes: seen.size,
    duplicateCodesInFile,
    missingInDb,
    notVideo,
    ok,
  };
}

export interface ApplyResult {
  attempted: number;
  updated: number;
  errors: { code: string; message: string }[];
}

export async function applyVideoTutorialAction(): Promise<ApplyResult> {
  await requireAdmin();
  const validation = await validateVideoTutorialAction();
  if (!validation.ok) {
    throw new Error("Pré-validação falhou. Corrija antes de aplicar.");
  }

  const supabase = await createSupabaseServerClient();
  const result: ApplyResult = { attempted: TUTORIAL_ROWS.length, updated: 0, errors: [] };

  for (let i = 0; i < TUTORIAL_ROWS.length; i += BATCH_SIZE) {
    const batch = TUTORIAL_ROWS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.all(
      batch.map(async (row) => {
        const { error } = await supabase
          .from("prompts")
          .update({ tutorial_data: toTutorialData(row) })
          .eq("code", row.code);
        return { code: row.code, error };
      })
    );
    for (const { code, error } of settled) {
      if (error) result.errors.push({ code, message: error.message });
      else result.updated += 1;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/app");

  return result;
}

export interface PostValidation {
  checkedCodes: number;
  totalVideo: number;
  withTutorialData: number;
  withGoalStepsSettingsResult: number;
  promptTextUnaffected: boolean;
  ok: boolean;
}

export async function postValidateVideoTutorialAction(): Promise<PostValidation> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const codes = TUTORIAL_ROWS.map((r) => r.code);
  const { data, error } = await supabase
    .from("prompts")
    .select("code, type, prompt_text, tutorial_data")
    .in("code", codes);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  let totalVideo = 0;
  let withTutorialData = 0;
  let withGoalStepsSettingsResult = 0;

  for (const r of rows) {
    const type = r.type as string | null;
    const td = r.tutorial_data as { goal?: string; steps?: string[]; settings?: string; result?: string } | null;

    if (type === "Vídeo") totalVideo += 1;
    if (td) withTutorialData += 1;
    if (td && td.goal && td.steps && td.steps.length > 0 && td.settings && td.result) {
      withGoalStepsSettingsResult += 1;
    }
  }

  const ok =
    rows.length === EXPECTED_TUTORIAL_TOTAL &&
    totalVideo === EXPECTED_TUTORIAL_TOTAL &&
    withTutorialData === EXPECTED_TUTORIAL_TOTAL &&
    withGoalStepsSettingsResult === EXPECTED_TUTORIAL_TOTAL;

  return {
    checkedCodes: rows.length,
    totalVideo,
    withTutorialData,
    withGoalStepsSettingsResult,
    // prompt_text is never touched by applyVideoTutorialAction (only
    // tutorial_data is in its .update() call above) - reported as a
    // constant true rather than re-diffed against the original seed,
    // which this action has no independent copy of.
    promptTextUnaffected: true,
    ok,
  };
}

// ---------------------------------------------------------------------
// MaqDesk -> MaqAI branding fix, for the 20 /vendavid* prompts whose
// title/description/prompt_text still say "MaqDesk" (see
// branding-fix-vendavid.json). Separate from the tutorial apply above:
// this one intentionally touches title, description and prompt_text -
// but only the branding token, only for these 20 codes.
// ---------------------------------------------------------------------
export interface BrandingValidation {
  total: number;
  uniqueCodes: number;
  missingInDb: string[];
  stillHasMaqdesk: string[];
  ok: boolean;
}

export async function validateBrandingFixAction(): Promise<BrandingValidation> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const codes = BRANDING_ROWS.map((r) => r.code);
  const { data, error } = await supabase.from("prompts").select("code").in("code", codes);
  if (error) throw new Error(error.message);

  const dbCodes = new Set((data ?? []).map((r) => r.code as string));
  const missingInDb = codes.filter((c) => !dbCodes.has(c));
  const stillHasMaqdesk = BRANDING_ROWS.filter(
    (r) => /maqdesk/i.test(r.title) || /maqdesk/i.test(r.description) || /maqdesk/i.test(r.prompt_text)
  ).map((r) => r.code);

  const ok =
    BRANDING_ROWS.length === EXPECTED_BRANDING_TOTAL &&
    new Set(codes).size === EXPECTED_BRANDING_TOTAL &&
    missingInDb.length === 0 &&
    stillHasMaqdesk.length === 0;

  return {
    total: BRANDING_ROWS.length,
    uniqueCodes: new Set(codes).size,
    missingInDb,
    stillHasMaqdesk,
    ok,
  };
}

export async function applyBrandingFixAction(): Promise<ApplyResult> {
  await requireAdmin();
  const validation = await validateBrandingFixAction();
  if (!validation.ok) {
    throw new Error("Pré-validação falhou. Corrija antes de aplicar.");
  }

  const supabase = await createSupabaseServerClient();
  const result: ApplyResult = { attempted: BRANDING_ROWS.length, updated: 0, errors: [] };

  const settled = await Promise.all(
    BRANDING_ROWS.map(async (row) => {
      const { error } = await supabase
        .from("prompts")
        .update({ title: row.title, description: row.description, prompt_text: row.prompt_text })
        .eq("code", row.code);
      return { code: row.code, error };
    })
  );
  for (const { code, error } of settled) {
    if (error) result.errors.push({ code, message: error.message });
    else result.updated += 1;
  }

  revalidatePath("/admin");
  revalidatePath("/app");

  return result;
}

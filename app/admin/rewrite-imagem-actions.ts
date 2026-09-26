"use server";

// Temporary action to apply rewrite-imagem-edit-maqai.json (OPER
// "Reescrever os 312 prompts de Imagem") through the admin session's own
// RLS-scoped client, instead of pasting supabase/rewrite-imagem-edit-maqai.sql
// by hand in the Supabase SQL Editor. Updates prompt_text only, keyed by
// code. Remove this file, its page and nav entry once the 312 rows are
// confirmed applied.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import rawRows from "@/rewrite-imagem-edit-maqai.json";

interface RewriteRow {
  catalog_number: number;
  code: string;
  title: string;
  description: string;
  prompt_text: string;
}

const ROWS = rawRows as RewriteRow[];
const EXPECTED_TOTAL = 312;
const UI_ONLY_EXEMPT = new Set(["/vendaimg008", "/vendaimg018"]);
const BATCH_SIZE = 25;

export interface RewriteValidation {
  total: number;
  uniqueCodes: number;
  duplicateCodesInFile: string[];
  missingInDb: string[];
  notImagem: string[];
  ok: boolean;
}

export async function validateImagemRewriteAction(): Promise<RewriteValidation> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const codes = ROWS.map((r) => r.code);
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
  const notImagem = codes.filter((c) => dbTypeByCode.has(c) && dbTypeByCode.get(c) !== "Imagem");

  const ok =
    ROWS.length === EXPECTED_TOTAL &&
    seen.size === EXPECTED_TOTAL &&
    duplicateCodesInFile.length === 0 &&
    missingInDb.length === 0 &&
    notImagem.length === 0;

  return {
    total: ROWS.length,
    uniqueCodes: seen.size,
    duplicateCodesInFile,
    missingInDb,
    notImagem,
    ok,
  };
}

export interface ApplyResult {
  attempted: number;
  updated: number;
  errors: { code: string; message: string }[];
}

export async function applyImagemRewriteAction(): Promise<ApplyResult> {
  await requireAdmin();
  const validation = await validateImagemRewriteAction();
  if (!validation.ok) {
    throw new Error("Pré-validação falhou. Corrija antes de aplicar.");
  }

  const supabase = await createSupabaseServerClient();
  const result: ApplyResult = { attempted: ROWS.length, updated: 0, errors: [] };

  for (let i = 0; i < ROWS.length; i += BATCH_SIZE) {
    const batch = ROWS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.all(
      batch.map(async (row) => {
        const { error } = await supabase
          .from("prompts")
          .update({ prompt_text: row.prompt_text })
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
  totalImagem: number;
  startsWithCode: number;
  mentionsUpload: number;
  matchesExpected: number;
  ok: boolean;
}

export async function postValidateImagemRewriteAction(): Promise<PostValidation> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const codes = ROWS.map((r) => r.code);
  const expectedByCode = new Map(ROWS.map((r) => [r.code, r.prompt_text]));

  const { data, error } = await supabase.from("prompts").select("code, type, prompt_text").in("code", codes);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  let totalImagem = 0;
  let startsWithCode = 0;
  let mentionsUpload = 0;
  let matchesExpected = 0;

  for (const r of rows) {
    const code = r.code as string;
    const type = r.type as string | null;
    const promptText = (r.prompt_text as string | null) ?? "";

    if (type === "Imagem") totalImagem += 1;
    if (promptText.startsWith(code + "\n\n")) startsWithCode += 1;
    if (UI_ONLY_EXEMPT.has(code) || /uploaded (machine )?(image|photo)/i.test(promptText)) {
      mentionsUpload += 1;
    }
    if (promptText === expectedByCode.get(code)) matchesExpected += 1;
  }

  const ok =
    rows.length === EXPECTED_TOTAL &&
    totalImagem === EXPECTED_TOTAL &&
    startsWithCode === EXPECTED_TOTAL &&
    mentionsUpload === EXPECTED_TOTAL &&
    matchesExpected === EXPECTED_TOTAL;

  return {
    checkedCodes: rows.length,
    totalImagem,
    startsWithCode,
    mentionsUpload,
    matchesExpected,
    ok,
  };
}

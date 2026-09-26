"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadPromptImage } from "@/lib/supabase/storage";
import { setPromptImageAction } from "@/app/admin/actions";

export interface CatalogLookupRow {
  id: string;
  code: string;
  catalogNumber: number;
  hasImage: boolean;
}

type Status = "ok" | "will_replace" | "will_skip" | "not_found" | "duplicate" | "invalid";

interface Entry {
  file: File;
  parsedNumber: number | null;
  status: Status;
  match?: CatalogLookupRow;
}

const STATUS_LABEL: Record<Status, string> = {
  ok: "Pronto para vincular",
  will_replace: "Vai substituir a imagem atual",
  will_skip: "Já tem imagem - será ignorado",
  not_found: "Número não existe",
  duplicate: "Número duplicado no lote",
  invalid: "Número não reconhecido no arquivo",
};

const STATUS_COLOR: Record<Status, string> = {
  ok: "text-accent",
  will_replace: "text-accent",
  will_skip: "text-muted",
  not_found: "text-red-400",
  duplicate: "text-red-400",
  invalid: "text-red-400",
};

// Only the leading digit run counts - "0042-machinebreakdown.webp" and
// "0042.jpg" both resolve to 42. A number anywhere but the start of the
// filename (e.g. "machinebreakdown-0042.jpg") is not recognized, per
// OPER "usar somente o número inicial".
function parseCatalogNumber(filename: string): number | null {
  const base = filename.replace(/\.[^./]+$/, "");
  const match = base.match(/^(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function PromptImageByNumberUpload({ prompts }: { prompts: CatalogLookupRow[] }) {
  const router = useRouter();
  const lookup = useMemo(() => new Map(prompts.map((p) => [p.catalogNumber, p])), [prompts]);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ linked: number; skipped: number; errors: number } | null>(null);

  function buildEntries(files: File[], replace: boolean): Entry[] {
    const parsed = files.map((file) => ({ file, parsedNumber: parseCatalogNumber(file.name) }));

    const counts = new Map<number, number>();
    for (const { parsedNumber } of parsed) {
      if (parsedNumber != null) counts.set(parsedNumber, (counts.get(parsedNumber) ?? 0) + 1);
    }

    return parsed.map(({ file, parsedNumber }) => {
      if (parsedNumber == null) return { file, parsedNumber, status: "invalid" };
      if ((counts.get(parsedNumber) ?? 0) > 1) return { file, parsedNumber, status: "duplicate" };

      const match = lookup.get(parsedNumber);
      if (!match) return { file, parsedNumber, status: "not_found" };
      if (match.hasImage) return { file, parsedNumber, match, status: replace ? "will_replace" : "will_skip" };
      return { file, parsedNumber, match, status: "ok" };
    });
  }

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setResult(null);
    setEntries(buildEntries(files, replaceExisting));
    e.target.value = "";
  }

  function handleReplaceToggle(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setReplaceExisting(next);
    // Re-derive status for already-previewed files instead of forcing a
    // re-select, so flipping the checkbox updates the preview live.
    setEntries((current) => buildEntries(current.map((entry) => entry.file), next));
  }

  const eligible = entries.filter((e): e is Entry & { match: CatalogLookupRow } =>
    e.status === "ok" || e.status === "will_replace"
  );

  async function handleConfirm() {
    setUploading(true);

    const skipped = entries.filter((e) => e.status === "will_skip").length;
    const blocked = entries.filter(
      (e) => e.status === "not_found" || e.status === "duplicate" || e.status === "invalid"
    ).length;

    let linked = 0;
    let errors = blocked;

    // Sequential on purpose: one failed upload/save must never block the
    // rest of the batch, and this keeps each file's outcome unambiguous.
    for (const entry of eligible) {
      try {
        const uploaded = await uploadPromptImage(entry.file);
        try {
          await setPromptImageAction(entry.match.id, uploaded.url);
          linked++;
        } catch (err) {
          console.error(`Failed to save image_url for #${entry.parsedNumber}:`, err);
          errors++;
        }
      } catch (err) {
        console.error(`Failed to upload image for #${entry.parsedNumber}:`, err);
        errors++;
      }
    }

    setResult({ linked, skipped, errors });
    setEntries([]);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/40 p-4">
      <div>
        <h2 className="text-sm font-bold text-foreground">Upload por número</h2>
        <p className="text-xs leading-relaxed text-muted">
          Vincula cada arquivo à imagem própria do prompt (prompts.image_url) pelo número no início
          do nome do arquivo - ex.: 0042.jpg, 0042-machinebreakdown.webp -&gt; prompt #0042.
          Diferente da biblioteca abaixo: aqui a imagem é exclusiva daquele prompt, não um fallback.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors duration-200 hover:border-border/80">
          Selecionar imagens
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSelect}
            disabled={uploading}
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={handleReplaceToggle}
            disabled={uploading}
            className="h-4 w-4 accent-accent"
          />
          Substituir imagens existentes
        </label>
      </div>

      {entries.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="p-2.5 font-semibold">Arquivo</th>
                  <th className="p-2.5 font-semibold">Nº</th>
                  <th className="p-2.5 font-semibold">Prompt</th>
                  <th className="p-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry, i) => (
                  <tr key={i}>
                    <td className="max-w-[140px] truncate p-2.5 text-foreground">{entry.file.name}</td>
                    <td className="p-2.5 font-mono text-muted">
                      {entry.parsedNumber != null ? `#${String(entry.parsedNumber).padStart(4, "0")}` : "-"}
                    </td>
                    <td className="p-2.5 font-mono text-muted">{entry.match?.code ?? "-"}</td>
                    <td className={`p-2.5 font-semibold ${STATUS_COLOR[entry.status]}`}>
                      {STATUS_LABEL[entry.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={uploading || eligible.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
            >
              {uploading ? "Enviando..." : `Confirmar upload (${eligible.length})`}
            </button>
            <button
              type="button"
              onClick={() => setEntries([])}
              disabled={uploading}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-surface p-3 text-xs text-foreground">
          Vinculados: <span className="font-semibold text-accent">{result.linked}</span> · Ignorados:{" "}
          <span className="font-semibold text-foreground">{result.skipped}</span> · Erros:{" "}
          <span className="font-semibold text-red-400">{result.errors}</span>
        </div>
      )}
    </div>
  );
}

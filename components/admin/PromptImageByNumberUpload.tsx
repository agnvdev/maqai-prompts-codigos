"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadPromptImage } from "@/lib/supabase/storage";
import { setPromptImageAction } from "@/app/admin/actions";

export interface CatalogLookupRow {
  id: string;
  code: string;
  title: string;
  catalogNumber: number;
  hasImage: boolean;
}

type Mode = "filename" | "sequence";

type Status = "ok" | "will_replace" | "will_skip" | "not_found" | "duplicate" | "invalid" | "no_number";

interface QueueEntry {
  file: File;
  previewUrl?: string;
  catalogNumber: number | null;
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
  no_number: "Sem número",
};

const STATUS_COLOR: Record<Status, string> = {
  ok: "text-accent",
  will_replace: "text-accent",
  will_skip: "text-muted",
  not_found: "text-red-400",
  duplicate: "text-red-400",
  invalid: "text-red-400",
  no_number: "text-red-400",
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

// "Números específicos" wins when filled, applied in queue order; a
// number is dropped (silently unused) if there are more numbers than
// images. Otherwise every image gets startNumber + its position in the
// queue; an empty/invalid start leaves every image without a number.
function computeSequenceNumbers(count: number, startNumber: string, specificNumbers: string): (number | null)[] {
  const specific = specificNumbers.trim();
  if (specific) {
    const nums = specific.split(",").map((s) => parseInt(s.trim(), 10));
    return Array.from({ length: count }, (_, i) => (Number.isFinite(nums[i]) ? nums[i] : null));
  }
  const start = parseInt(startNumber.trim(), 10);
  if (!Number.isFinite(start)) return Array.from({ length: count }, () => null);
  return Array.from({ length: count }, (_, i) => start + i);
}

// Shared by both modes: resolves each (file, catalogNumber) pair against
// the real prompt lookup, flags in-batch duplicate numbers as a blocking
// conflict, and folds in the replace-existing checkbox. `noNumberStatus`
// only changes the label shown when no number could be assigned - the
// filename mode calls that "not recognized", sequence mode calls it
// "missing", the reason differs but the outcome (blocked) is the same.
function deriveEntries(
  pairs: { file: File; catalogNumber: number | null; previewUrl?: string }[],
  lookup: Map<number, CatalogLookupRow>,
  replace: boolean,
  noNumberStatus: "invalid" | "no_number"
): QueueEntry[] {
  const counts = new Map<number, number>();
  for (const { catalogNumber } of pairs) {
    if (catalogNumber != null) counts.set(catalogNumber, (counts.get(catalogNumber) ?? 0) + 1);
  }

  return pairs.map(({ file, catalogNumber, previewUrl }) => {
    if (catalogNumber == null) return { file, previewUrl, catalogNumber, status: noNumberStatus };
    if ((counts.get(catalogNumber) ?? 0) > 1) return { file, previewUrl, catalogNumber, status: "duplicate" };

    const match = lookup.get(catalogNumber);
    if (!match) return { file, previewUrl, catalogNumber, status: "not_found" };
    if (match.hasImage) {
      return { file, previewUrl, catalogNumber, match, status: replace ? "will_replace" : "will_skip" };
    }
    return { file, previewUrl, catalogNumber, match, status: "ok" };
  });
}

export function PromptImageByNumberUpload({ prompts }: { prompts: CatalogLookupRow[] }) {
  const router = useRouter();
  const lookup = useMemo(() => new Map(prompts.map((p) => [p.catalogNumber, p])), [prompts]);

  const [mode, setMode] = useState<Mode>("filename");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ linked: number; skipped: number; errors: number } | null>(null);

  // Mode "Por nome do arquivo": selecting files replaces the whole
  // preview (unchanged from before this OPER).
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const filenameEntries = useMemo(
    () =>
      deriveEntries(
        selectedFiles.map((file) => ({ file, catalogNumber: parseCatalogNumber(file.name) })),
        lookup,
        replaceExisting,
        "invalid"
      ),
    [selectedFiles, lookup, replaceExisting]
  );

  // Mode "Por sequência": a queue that only ever grows (order preserved)
  // until cleared/removed from/confirmed, numbered by position.
  const [queueItems, setQueueItems] = useState<{ file: File; previewUrl: string }[]>([]);
  const [startNumber, setStartNumber] = useState("");
  const [specificNumbers, setSpecificNumbers] = useState("");
  const sequenceNumbers = useMemo(
    () => computeSequenceNumbers(queueItems.length, startNumber, specificNumbers),
    [queueItems.length, startNumber, specificNumbers]
  );
  const sequenceEntries = useMemo(
    () =>
      deriveEntries(
        queueItems.map((item, i) => ({
          file: item.file,
          previewUrl: item.previewUrl,
          catalogNumber: sequenceNumbers[i] ?? null,
        })),
        lookup,
        replaceExisting,
        "no_number"
      ),
    [queueItems, sequenceNumbers, lookup, replaceExisting]
  );

  const activeEntries = mode === "filename" ? filenameEntries : sequenceEntries;
  const eligible = activeEntries.filter(
    (e): e is QueueEntry & { match: CatalogLookupRow } => e.status === "ok" || e.status === "will_replace"
  );

  function selectMode(next: Mode) {
    setMode(next);
    setResult(null);
  }

  function handleSelectFilename(e: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(e.target.files ?? []));
    setResult(null);
    e.target.value = "";
  }

  function handleAddToQueue(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const added = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setQueueItems((prev) => [...prev, ...added]);
    setResult(null);
    e.target.value = "";
  }

  function removeFromQueue(index: number) {
    setQueueItems((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearQueue() {
    setQueueItems((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
    setStartNumber("");
    setSpecificNumbers("");
    setResult(null);
  }

  async function handleConfirm() {
    setUploading(true);

    const skipped = activeEntries.filter((e) => e.status === "will_skip").length;
    let linked = 0;
    let errors = activeEntries.length - eligible.length - skipped;

    // Sequential on purpose: one failed upload/save must never block the
    // rest of the batch, and this keeps each file's outcome unambiguous.
    for (const entry of eligible) {
      try {
        const uploaded = await uploadPromptImage(entry.file);
        try {
          await setPromptImageAction(entry.match.id, uploaded.url);
          linked++;
        } catch (err) {
          console.error(`Failed to save image_url for #${entry.catalogNumber}:`, err);
          errors++;
        }
      } catch (err) {
        console.error(`Failed to upload image for #${entry.catalogNumber}:`, err);
        errors++;
      }
    }

    setResult({ linked, skipped, errors });
    if (mode === "filename") {
      setSelectedFiles([]);
    } else {
      for (const item of queueItems) URL.revokeObjectURL(item.previewUrl);
      setQueueItems([]);
      setStartNumber("");
      setSpecificNumbers("");
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/40 p-4">
      <div>
        <h2 className="text-sm font-bold text-foreground">Upload por número</h2>
        <p className="text-xs leading-relaxed text-muted">
          Vincula cada imagem à imagem própria do prompt (prompts.image_url). Diferente da
          biblioteca abaixo: aqui a imagem é exclusiva daquele prompt, não um fallback.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 sm:w-fit">
        {(
          [
            ["filename", "Por nome do arquivo"],
            ["sequence", "Por sequência"],
          ] as const
        ).map(([id, label]) => {
          const active = id === mode;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectMode(id)}
              aria-pressed={active}
              disabled={uploading}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] sm:flex-none ${
                active ? "bg-accent text-accent-foreground shadow-card" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-muted">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
          disabled={uploading}
          className="h-4 w-4 accent-accent"
        />
        Substituir imagens existentes
      </label>

      {mode === "filename" ? (
        <label className="w-fit cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors duration-200 hover:border-border/80">
          Selecionar imagens
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSelectFilename}
            disabled={uploading}
          />
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted sm:w-40">
              Número inicial
              <input
                type="text"
                inputMode="numeric"
                placeholder="0001"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                disabled={uploading || specificNumbers.trim() !== ""}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50 disabled:opacity-50"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium text-muted">
              Números específicos (opcional, sobrepõe o número inicial)
              <input
                type="text"
                placeholder="0001,0005,0012"
                value={specificNumbers}
                onChange={(e) => setSpecificNumbers(e.target.value)}
                disabled={uploading}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="w-fit cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors duration-200 hover:border-border/80">
              Adicionar imagens à fila
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddToQueue}
                disabled={uploading}
              />
            </label>
            {queueItems.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                disabled={uploading}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                Limpar fila
              </button>
            )}
          </div>
        </div>
      )}

      {activeEntries.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="p-2.5 font-semibold">{mode === "filename" ? "Arquivo" : "Imagem"}</th>
                  <th className="p-2.5 font-semibold">Nº</th>
                  <th className="p-2.5 font-semibold">Code</th>
                  <th className="p-2.5 font-semibold">Título</th>
                  <th className="p-2.5 font-semibold">Status</th>
                  {mode === "sequence" && <th className="p-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeEntries.map((entry, i) => (
                  <tr key={i}>
                    <td className="p-2.5">
                      {mode === "sequence" && entry.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.previewUrl}
                          alt=""
                          className="h-9 w-9 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <span className="max-w-[120px] truncate text-foreground">{entry.file.name}</span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-muted">
                      {entry.catalogNumber != null ? `#${String(entry.catalogNumber).padStart(4, "0")}` : "-"}
                    </td>
                    <td className="p-2.5 font-mono text-muted">{entry.match?.code ?? "-"}</td>
                    <td className="max-w-[160px] truncate p-2.5 text-muted">{entry.match?.title ?? "-"}</td>
                    <td className={`p-2.5 font-semibold ${STATUS_COLOR[entry.status]}`}>
                      {STATUS_LABEL[entry.status]}
                    </td>
                    {mode === "sequence" && (
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => removeFromQueue(i)}
                          disabled={uploading}
                          aria-label="Remover da fila"
                          className="text-muted hover:text-red-400"
                        >
                          ×
                        </button>
                      </td>
                    )}
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
              onClick={() => (mode === "filename" ? setSelectedFiles([]) : clearQueue())}
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

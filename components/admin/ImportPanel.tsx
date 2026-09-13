"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  parseCsvRows,
  parseJsonRows,
  dedupeByCode,
  chunkRows,
  type ParsedRow,
  type ImportResult,
} from "@/lib/admin/import";
import { importPromptsAction } from "@/app/admin/actions";

const CHUNK_SIZE = 200;
const PREVIEW_LIMIT = 200;

interface QueueFile {
  id: string;
  name: string;
  status: "parsing" | "parsed" | "error";
  rows: ParsedRow[];
  error?: string;
}

export function ImportPanel({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setResult(null);

    const entries: QueueFile[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      status: "parsing",
      rows: [],
    }));
    setQueue((prev) => [...prev, ...entries]);

    files.forEach((file, i) => {
      const id = entries[i].id;
      file
        .text()
        .then((text) => {
          const isCsv = file.name.toLowerCase().endsWith(".csv");
          const rows = isCsv ? parseCsvRows(text) : parseJsonRows(text);
          setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "parsed", rows } : q)));
        })
        .catch((err) => {
          console.error("Failed to parse import file:", file.name, err);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === id ? { ...q, status: "error", error: "Arquivo inválido (JSON/CSV malformado)." } : q
            )
          );
        });
    });

    e.target.value = "";
  }

  function removeFile(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function clearQueue() {
    setQueue([]);
    setResult(null);
    setProgress(null);
  }

  // Global view across every parsed file, deduplicated by code so a
  // duplicate appearing in a later file (or later in the same file) is
  // flagged instead of being sent to the server twice.
  const globalRows = useMemo(() => {
    const withFile = queue.flatMap((f) =>
      f.status === "parsed" ? f.rows.map((row) => ({ row, fileName: f.name })) : []
    );
    const { rows: deduped } = dedupeByCode(withFile.map((w) => w.row));
    return deduped.map((row, i) => ({ row, fileName: withFile[i].fileName }));
  }, [queue]);

  const validEntries = globalRows.filter((g) => g.row.valid);
  const invalidCount = globalRows.length - validEntries.length;
  const parsingCount = queue.filter((q) => q.status === "parsing").length;
  const errorFiles = queue.filter((q) => q.status === "error");

  async function handleImportAll() {
    const toImport = validEntries.map((g) => g.row.data);
    if (toImport.length === 0) return;

    setImporting(true);
    setResult(null);

    const chunks = chunkRows(toImport, CHUNK_SIZE);
    setProgress({ current: 0, total: chunks.length });

    const aggregate: ImportResult = { imported: 0, skippedDuplicates: 0, invalid: 0, errors: [] };

    for (let i = 0; i < chunks.length; i++) {
      try {
        const res = await importPromptsAction(chunks[i]);
        aggregate.imported += res.imported;
        aggregate.skippedDuplicates += res.skippedDuplicates;
        aggregate.invalid += res.invalid;
        aggregate.errors.push(...res.errors);
      } catch (err) {
        console.error(`Failed to import chunk ${i + 1}/${chunks.length}:`, err);
        aggregate.errors.push(`Lote ${i + 1} de ${chunks.length} falhou e foi ignorado.`);
      }
      setProgress({ current: i + 1, total: chunks.length });
    }

    setResult(aggregate);
    setImporting(false);
    onImported();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Importar prompts</h2>
        <button type="button" onClick={onClose} className="text-xs font-medium text-muted">
          Fechar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="w-fit cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          Escolher arquivos (JSON ou CSV)
          <input type="file" accept=".json,.csv" multiple onChange={handleFiles} className="hidden" />
        </label>
        {queue.length > 0 && (
          <button type="button" onClick={clearQueue} className="text-xs font-medium text-muted">
            Limpar fila
          </button>
        )}
      </div>

      {queue.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {queue.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
            >
              <span className="truncate text-foreground">{f.name}</span>
              <div className="flex items-center gap-2">
                {f.status === "parsing" && <span className="text-muted">Lendo...</span>}
                {f.status === "parsed" && (
                  <span className="text-accent">{f.rows.length} linhas</span>
                )}
                {f.status === "error" && <span className="text-red-400">{f.error}</span>}
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="text-muted hover:text-foreground"
                  aria-label={`Remover ${f.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {errorFiles.length > 0 && (
        <p className="text-xs text-red-400">
          {errorFiles.length} arquivo(s) não puderam ser lidos e foram ignorados.
        </p>
      )}

      {globalRows.length > 0 && (
        <>
          <p className="text-xs text-muted">
            {queue.filter((q) => q.status === "parsed").length} arquivo(s) lidos:{" "}
            <b className="text-foreground">{validEntries.length}</b> válidos,{" "}
            <b className="text-foreground">{invalidCount}</b> inválidos/duplicados de {globalRows.length} linhas
            no total.
          </p>

          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  <th className="p-2">Status</th>
                  <th className="p-2">Arquivo</th>
                  <th className="p-2">Código</th>
                  <th className="p-2">Título</th>
                  <th className="p-2">Segmento</th>
                  <th className="p-2">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {globalRows.slice(0, PREVIEW_LIMIT).map((g, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2">
                      {g.row.valid ? (
                        <span className="text-accent">{g.row.reason ?? "OK"}</span>
                      ) : (
                        <span className="text-red-400">{g.row.reason ?? "Inválido"}</span>
                      )}
                    </td>
                    <td className="max-w-[120px] truncate p-2 text-muted">{g.fileName}</td>
                    <td className="p-2 font-mono">{g.row.data.code}</td>
                    <td className="p-2">{g.row.data.title}</td>
                    <td className="p-2">{g.row.data.segment}</td>
                    <td className="p-2">{g.row.data.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {globalRows.length > PREVIEW_LIMIT && (
              <p className="border-t border-border p-2 text-center text-[11px] text-muted">
                Mostrando as primeiras {PREVIEW_LIMIT} de {globalRows.length} linhas.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleImportAll}
            disabled={importing || parsingCount > 0 || validEntries.length === 0}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-60"
          >
            {importing
              ? `Importando... (${progress?.current ?? 0}/${progress?.total ?? 0} lotes)`
              : `Importar tudo (${validEntries.length} prompts em lotes de ${CHUNK_SIZE})`}
          </button>

          {importing && progress && progress.total > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </>
      )}

      {result && (
        <p className="text-xs text-muted">
          Importados: <b className="text-foreground">{result.imported}</b> · Ignorados (duplicados):{" "}
          <b className="text-foreground">{result.skippedDuplicates}</b> · Inválidos:{" "}
          <b className="text-foreground">{invalidCount}</b>
          {result.errors.length > 0 && (
            <span className="block text-red-400">{result.errors.join(" ")}</span>
          )}
        </p>
      )}
    </div>
  );
}

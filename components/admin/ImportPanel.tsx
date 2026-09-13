"use client";

import { useState, type ChangeEvent } from "react";
import { parseCsvRows, parseJsonRows, dedupeByCode, type ParsedRow, type ImportResult } from "@/lib/admin/import";
import { importPromptsAction } from "@/app/admin/actions";

export function ImportPanel({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setResult(null);
    setRows([]);

    try {
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const parsed = isCsv ? parseCsvRows(text) : parseJsonRows(text);
      const { rows: deduped } = dedupeByCode(parsed);
      setRows(deduped);
    } catch (err) {
      console.error("Failed to parse import file:", err);
      setParseError("Não foi possível ler o arquivo. Verifique se é um JSON ou CSV válido.");
    }
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid).map((r) => r.data);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await importPromptsAction(validRows);
      setResult(res);
      onImported();
    } catch (err) {
      console.error("Failed to import prompts:", err);
      setResult({ imported: 0, skippedDuplicates: 0, invalid: 0, errors: ["Falha ao importar. Tente novamente."] });
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Importar prompts</h2>
        <button type="button" onClick={onClose} className="text-xs font-medium text-muted">
          Fechar
        </button>
      </div>

      <label className="w-fit cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
        Escolher arquivo (JSON ou CSV)
        <input type="file" accept=".json,.csv" onChange={handleFile} className="hidden" />
      </label>

      {parseError && <p className="text-xs text-red-400">{parseError}</p>}

      {rows.length > 0 && (
        <>
          <p className="text-xs text-muted">
            {fileName}: <b className="text-foreground">{validCount}</b> válidos,{" "}
            <b className="text-foreground">{invalidCount}</b> inválidos de {rows.length} linhas.
          </p>

          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  <th className="p-2">Status</th>
                  <th className="p-2">Código</th>
                  <th className="p-2">Título</th>
                  <th className="p-2">Segmento</th>
                  <th className="p-2">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2">
                      {row.valid ? (
                        <span className="text-accent">{row.reason ?? "OK"}</span>
                      ) : (
                        <span className="text-red-400">{row.reason ?? "Inválido"}</span>
                      )}
                    </td>
                    <td className="p-2 font-mono">{row.data.code}</td>
                    <td className="p-2">{row.data.title}</td>
                    <td className="p-2">{row.data.segment}</td>
                    <td className="p-2">{row.data.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing || validCount === 0}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-60"
          >
            {importing ? "Importando..." : `Importar ${validCount} prompts`}
          </button>
        </>
      )}

      {result && (
        <p className="text-xs text-muted">
          Importados: <b className="text-foreground">{result.imported}</b> · Ignorados (duplicados):{" "}
          <b className="text-foreground">{result.skippedDuplicates}</b>
          {result.errors.length > 0 && <span className="block text-red-400">{result.errors.join(" ")}</span>}
        </p>
      )}
    </div>
  );
}

export interface ImportRow {
  code: string;
  title: string;
  description?: string | null;
  prompt_text?: string | null;
  image_url?: string | null;
  segment?: string | null;
  type?: string | null;
  tools?: string[];
  tags?: string[];
  featured?: boolean;
  is_premium?: boolean;
  is_active?: boolean;
}

export interface ParsedRow {
  data: ImportRow;
  valid: boolean;
  reason?: string;
}

export interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  invalid: number;
  errors: string[];
}

const SEGMENTS = ["Geral", "Máquinas Pesadas", "Agro", "Mineração"];
const TYPES = ["Imagem", "Vídeo", "Texto"];

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const s = String(value ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "sim" || s === "yes";
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toStringOrNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function rawRowToImportRow(raw: Record<string, unknown>): ImportRow {
  return {
    code: String(raw.code ?? "").trim(),
    title: String(raw.title ?? "").trim(),
    description: toStringOrNull(raw.description),
    prompt_text: toStringOrNull(raw.prompt_text ?? raw.prompt),
    image_url: toStringOrNull(raw.image_url),
    segment: toStringOrNull(raw.segment),
    type: toStringOrNull(raw.type),
    tools: toList(raw.tools),
    tags: toList(raw.tags),
    featured: toBool(raw.featured),
    is_premium: toBool(raw.is_premium ?? raw.premium),
    is_active: raw.is_active === undefined && raw.active === undefined ? true : toBool(raw.is_active ?? raw.active),
  };
}

function validate(row: ImportRow): ParsedRow {
  if (!row.code) return { data: row, valid: false, reason: "Código ausente" };
  if (!row.title) return { data: row, valid: false, reason: "Título ausente" };
  if (row.segment && !SEGMENTS.includes(row.segment)) {
    return { data: { ...row, segment: null }, valid: true, reason: "Segmento desconhecido (ignorado)" };
  }
  if (row.type && !TYPES.includes(row.type)) {
    return { data: { ...row, type: null }, valid: true, reason: "Tipo desconhecido (ignorado)" };
  }
  return { data: row, valid: true };
}

export function parseJsonRows(text: string): ParsedRow[] {
  const parsed = JSON.parse(text);
  const list: unknown[] = Array.isArray(parsed) ? parsed : (parsed?.prompts ?? []);

  if (!Array.isArray(list)) {
    throw new Error("JSON deve ser uma lista de prompts (ou { \"prompts\": [...] }).");
  }

  return list.map((item) => validate(rawRowToImportRow((item ?? {}) as Record<string, unknown>)));
}

export function parseCsvRows(text: string): ParsedRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];

  const headers = table[0].map((h) => h.trim().toLowerCase());
  const dataRows = table.slice(1);

  return dataRows.map((cells) => {
    const raw: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      raw[header] = cells[i] ?? "";
    });
    return validate(rawRowToImportRow(raw));
  });
}

export function chunkRows<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function dedupeByCode(rows: ParsedRow[]): { rows: ParsedRow[]; duplicates: number } {
  const seen = new Set<string>();
  let duplicates = 0;

  const deduped = rows.map((row) => {
    if (!row.valid) return row;
    if (seen.has(row.data.code)) {
      duplicates += 1;
      return { ...row, valid: false, reason: "Código duplicado no arquivo" };
    }
    seen.add(row.data.code);
    return row;
  });

  return { rows: deduped, duplicates };
}

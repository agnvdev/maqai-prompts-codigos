"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { LP_MEDIA_SLOTS, type LpMediaRow, type LpMediaSlot } from "@/lib/supabase/lpMedia";
import { saveLpMediaAction, deleteLpMediaAction, toggleLpMediaActiveAction } from "@/app/admin/media-actions";
import { uploadLpMediaImage } from "@/lib/supabase/storage";

const SLOT_LABELS: Record<LpMediaSlot, string> = {
  hero: "Hero",
  before_after: "Antes/Depois (legado)",
  examples: "Exemplos",
  segments: "Segmentos",
  final_cta: "CTA final",
  logo: "Logo/Assets",
};

// Purpose + recommended dimension shown under each slot, plus the exact
// identifier values each slot actually reads (Hero/Examples/Segments are
// keyed by literal string match — a typo in the identifier silently does
// nothing). Kept here instead of a DB column since it only ever changes
// alongside the components that consume it.
const SLOT_GUIDANCE: Record<LpMediaSlot, { purpose: string; dimension: string; identifiers?: string }> = {
  hero: {
    purpose: "Imagem de fundo da seção principal, no topo da página.",
    dimension: "1920×1080 (16:9) ou maior, formato paisagem.",
    identifiers: 'Identificador precisa ser exatamente "hero".',
  },
  before_after: {
    purpose:
      "Substituído pela seção dedicada \"Antes/Depois\" abaixo, que guarda os pares completos. Este slot antigo só guardava uma imagem solta e não é mais exibido no site — mantido aqui apenas para não perder o que já foi enviado.",
    dimension: "—",
  },
  examples: {
    purpose: "Foto de fundo dos cards de exemplo de prompts, por segmento.",
    dimension: "1600×900 (16:9).",
    identifiers: 'Identificador precisa ser um segmento exato: "Geral", "Máquinas Pesadas", "Agro" ou "Mineração".',
  },
  segments: {
    purpose: "Foto de fundo dos 3 cards de segmento (Máquinas Pesadas, Agro, Mineração).",
    dimension: "1200×1500 (4:5, retrato) ou maior — a imagem é cortada (object-cover).",
    identifiers: 'Identificador precisa ser exatamente "Máquinas Pesadas", "Agro" ou "Mineração".',
  },
  final_cta: {
    purpose: "Reservado para uma imagem de fundo na seção final de call-to-action.",
    dimension: "1920×1080 (16:9).",
    identifiers: "Ainda não exibido publicamente — nenhum componente da LP lê este slot hoje.",
  },
  logo: {
    purpose: 'Reservado para um logo em imagem. Hoje a marca usa só texto ("MaqAI").',
    dimension: "512×512 (quadrado) ou SVG.",
    identifiers: "Ainda não exibido publicamente — nenhum componente da LP lê este slot hoje.",
  },
};

// Combined so admins get autocomplete for the identifiers that actually
// matter, without needing per-slot dynamic filtering (the slot itself is
// picked in the same form via a plain <select>).
const KNOWN_IDENTIFIERS = ["hero", "Geral", "Máquinas Pesadas", "Agro", "Mineração"];

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

export function LpMediaClient({ items }: { items: LpMediaRow[] }) {
  const [editing, setEditing] = useState<Partial<LpMediaRow> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function startCreate(slot?: LpMediaSlot) {
    setEditing(slot ? { slot } : null);
    setFormImageUrl("");
    setUploadError(null);
    setShowForm(true);
  }

  function startEdit(item: LpMediaRow) {
    setEditing(item);
    setFormImageUrl(item.image_url ?? "");
    setUploadError(null);
    setShowForm(true);
  }

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadLpMediaImage(file);
      setFormImageUrl(uploaded.url);
    } catch (err) {
      console.error("Failed to upload LP media image:", err);
      setUploadError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, LpMediaRow[]>();
    for (const slot of LP_MEDIA_SLOTS) map.set(slot, []);
    for (const item of items) {
      if (!map.has(item.slot)) map.set(item.slot, []);
      map.get(item.slot)!.push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Mídias da LP</h1>
        <button
          type="button"
          onClick={() => startCreate()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
        >
          Nova mídia
        </button>
      </div>

      {showForm && (
        <form
          key={editing?.id ?? "new"}
          action={async (formData) => {
            await saveLpMediaAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          {editing?.id && <input type="hidden" name="id" defaultValue={editing.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Slot">
              <select name="slot" defaultValue={editing?.slot ?? "hero"} className={inputClass}>
                {LP_MEDIA_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {SLOT_LABELS[slot]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Identificador">
              <input
                name="identifier"
                list="lp-media-identifiers"
                defaultValue={editing?.identifier}
                placeholder="ex.: hero, Agro, Máquinas Pesadas..."
                required
                className={inputClass}
              />
              <datalist id="lp-media-identifiers">
                {KNOWN_IDENTIFIERS.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Posição">
            <input
              type="number"
              name="position"
              defaultValue={editing?.position ?? 0}
              className={inputClass}
            />
          </Field>

          <Field label="Imagem">
            <div className="flex flex-col gap-2">
              {formImageUrl && (
                <div className="h-32 w-full max-w-[220px] overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                  {uploading ? "Enviando..." : formImageUrl ? "Substituir" : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {formImageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormImageUrl("")}
                    className="text-xs font-medium text-red-400"
                  >
                    Remover
                  </button>
                )}
              </div>

              {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}

              <input type="hidden" name="image_url" value={formImageUrl} readOnly />
            </div>
          </Field>

          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={editing?.is_active ?? true}
              className="h-4 w-4 accent-accent"
            />
            Ativo
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-60"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-6">
        {LP_MEDIA_SLOTS.map((slot) => {
          const slotItems = grouped.get(slot) ?? [];
          return (
            <div key={slot} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">{SLOT_LABELS[slot]}</h2>
                <button
                  type="button"
                  onClick={() => startCreate(slot)}
                  className="text-xs font-medium text-accent"
                >
                  + Adicionar
                </button>
              </div>

              <div className="flex flex-col gap-0.5 text-xs text-muted">
                <p>
                  <span className="font-semibold text-foreground">Finalidade:</span>{" "}
                  {SLOT_GUIDANCE[slot].purpose}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Dimensão recomendada:</span>{" "}
                  {SLOT_GUIDANCE[slot].dimension}
                </p>
                {SLOT_GUIDANCE[slot].identifiers && <p>{SLOT_GUIDANCE[slot].identifiers}</p>}
              </div>

              {slotItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                  Nenhum item cadastrado.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {slotItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-border" />
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">{item.identifier}</span>
                          <span className="text-xs text-muted">Posição {item.position}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <form action={toggleLpMediaActiveAction.bind(null, item.id, !item.is_active)}>
                          <button
                            type="submit"
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              item.is_active ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
                            }`}
                          >
                            {item.is_active ? "Ativo" : "Inativo"}
                          </button>
                        </form>

                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground"
                        >
                          Editar
                        </button>

                        <form action={deleteLpMediaAction.bind(null, item.id)}>
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`Remover "${item.identifier}"?`)) e.preventDefault();
                            }}
                            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-red-400"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

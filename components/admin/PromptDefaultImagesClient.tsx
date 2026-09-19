"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { CATEGORIES, SEGMENTS, TYPES } from "@/lib/taxonomy";
import { PROMPT_DEFAULT_AXES, type PromptDefaultAxis, type PromptDefaultImageRow } from "@/lib/supabase/promptDefaults";
import {
  savePromptDefaultImageAction,
  deletePromptDefaultImageAction,
  togglePromptDefaultImageActiveAction,
} from "@/app/admin/media-actions";
import { uploadPromptDefaultImage } from "@/lib/supabase/storage";

const AXIS_LABELS: Record<PromptDefaultAxis, string> = {
  category: "Categoria",
  segment: "Segmento",
  type: "Tipo",
};

const AXIS_VALUES: Record<PromptDefaultAxis, readonly string[]> = {
  category: CATEGORIES,
  segment: SEGMENTS,
  type: TYPES,
};

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

export function PromptDefaultImagesClient({ items }: { items: PromptDefaultImageRow[] }) {
  const [editing, setEditing] = useState<Partial<PromptDefaultImageRow> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function startCreate(axis?: PromptDefaultAxis, value?: string) {
    setEditing(axis ? { axis, value } : null);
    setFormImageUrl("");
    setUploadError(null);
    setShowForm(true);
  }

  function startEdit(item: PromptDefaultImageRow) {
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
      const uploaded = await uploadPromptDefaultImage(file);
      setFormImageUrl(uploaded.url);
    } catch (err) {
      console.error("Failed to upload prompt default image:", err);
      setUploadError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // axis -> value -> rows. Multiple rows per (axis, value) are expected
  // (a small pool of default images to add variety), unlike lp_media.
  const grouped = useMemo(() => {
    const map = new Map<PromptDefaultAxis, Map<string, PromptDefaultImageRow[]>>();
    for (const axis of PROMPT_DEFAULT_AXES) {
      const byValue = new Map<string, PromptDefaultImageRow[]>();
      for (const value of AXIS_VALUES[axis]) byValue.set(value, []);
      map.set(axis, byValue);
    }
    for (const item of items) {
      const byValue = map.get(item.axis);
      if (!byValue) continue;
      if (!byValue.has(item.value)) byValue.set(item.value, []);
      byValue.get(item.value)!.push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Imagens padrão dos prompts</h1>
          <p className="text-xs text-muted">
            Usadas nos cards quando o prompt não tem imagem própria. Prioridade: imagem do
            prompt → categoria → segmento → tipo → ícone padrão.
          </p>
        </div>
        <button
          onClick={() => startCreate()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
        >
          Nova imagem
        </button>
      </div>

      {showForm && (
        <form
          key={editing?.id ?? "new"}
          action={async (formData) => {
            await savePromptDefaultImageAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          {editing?.id && <input type="hidden" name="id" defaultValue={editing.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Eixo">
              <select name="axis" defaultValue={editing?.axis ?? "category"} className={inputClass}>
                {PROMPT_DEFAULT_AXES.map((axis) => (
                  <option key={axis} value={axis}>
                    {AXIS_LABELS[axis]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valor">
              <input
                name="value"
                list="prompt-default-values"
                defaultValue={editing?.value}
                placeholder="ex.: Agro, Máquinas Pesadas, Imagem..."
                required
                className={inputClass}
              />
              <datalist id="prompt-default-values">
                {PROMPT_DEFAULT_AXES.flatMap((axis) => AXIS_VALUES[axis]).map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Posição (para escolher entre várias imagens do mesmo grupo)">
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

              <input type="hidden" name="image_url" value={formImageUrl} readOnly required />
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
              disabled={uploading || !formImageUrl}
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

      <div className="flex flex-col gap-8">
        {PROMPT_DEFAULT_AXES.map((axis) => (
          <div key={axis} className="flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{AXIS_LABELS[axis]}</h2>
            {AXIS_VALUES[axis].map((value) => {
              const rows = grouped.get(axis)?.get(value) ?? [];
              return (
                <div key={value} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{value}</h3>
                    <button
                      onClick={() => startCreate(axis, value)}
                      className="text-xs font-medium text-accent"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {rows.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">
                      Nenhuma imagem cadastrada — os cards usam o ícone padrão.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rows.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-xs text-muted">Posição {item.position}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <form action={togglePromptDefaultImageActiveAction.bind(null, item.id, !item.is_active)}>
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

                            <form action={deletePromptDefaultImageAction.bind(null, item.id)}>
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm(`Remover esta imagem de "${value}"?`)) e.preventDefault();
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
        ))}
      </div>
    </div>
  );
}

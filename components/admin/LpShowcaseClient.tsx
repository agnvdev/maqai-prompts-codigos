"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import type { LpShowcaseItem } from "@/lib/supabase/lpShowcase";
import {
  saveLpShowcaseItemAction,
  deleteLpShowcaseItemAction,
  toggleLpShowcaseItemActiveAction,
} from "@/app/admin/media-actions";
import { uploadLpMediaImage } from "@/lib/supabase/storage";
import { LP_SEGMENTS } from "@/lib/images";

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

export function LpShowcaseClient({ items }: { items: LpShowcaseItem[] }) {
  const [editing, setEditing] = useState<Partial<LpShowcaseItem> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function startCreate() {
    setEditing(null);
    setImageUrl("");
    setUploadError(null);
    setShowForm(true);
  }

  function startEdit(item: LpShowcaseItem) {
    setEditing(item);
    setImageUrl(item.image_url);
    setUploadError(null);
    setShowForm(true);
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadLpMediaImage(file);
      setImageUrl(uploaded.url);
    } catch (err) {
      console.error("Failed to upload showcase image:", err);
      setUploadError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Mostruário</h1>
          <p className="text-xs text-muted">
            Resultados exibidos na seção &quot;Resultados que você pode criar com a MaqDesk&quot; da
            página inicial. Apenas imagem, título curto e segmento opcional - nunca um card real do
            catálogo. Dimensão recomendada: 1200×1500 (4:5) ou 1600×900 (16:9).
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
        >
          + Novo resultado
        </button>
      </div>

      {showForm && (
        <form
          key={editing?.id ?? "new"}
          action={async (formData) => {
            await saveLpShowcaseItemAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          {editing?.id && <input type="hidden" name="id" defaultValue={editing.id} />}

          <Field label="Imagem">
            <div className="flex flex-col gap-2">
              <div className="flex h-32 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-2">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Nenhuma imagem</span>
                )}
              </div>
              <label className="w-fit cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                {uploading ? "Enviando..." : imageUrl ? "Substituir" : "Enviar imagem"}
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
              {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
              <input type="hidden" name="image_url" value={imageUrl} readOnly required />
            </div>
          </Field>

          <Field label="Título curto">
            <input
              name="title"
              defaultValue={editing?.title ?? ""}
              placeholder="ex.: Render industrial premium"
              required
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Segmento (opcional)">
              <select name="segment" defaultValue={editing?.segment ?? ""} className={inputClass}>
                <option value="">Nenhum</option>
                {LP_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Posição">
              <input type="number" name="position" defaultValue={editing?.position ?? 0} className={inputClass} />
            </Field>
          </div>

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
              disabled={uploading || !imageUrl}
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

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
          Nenhum resultado cadastrado - a seção &quot;Resultados que você pode criar com a
          MaqDesk&quot; fica oculta na página inicial até o primeiro item ativo.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs text-muted">
                    {item.segment ? `${item.segment} · ` : ""}Posição {item.position}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <form action={toggleLpShowcaseItemActiveAction.bind(null, item.id, !item.is_active)}>
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
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground"
                >
                  Editar
                </button>

                <form action={deleteLpShowcaseItemAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm(`Remover "${item.title}"?`)) e.preventDefault();
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
}

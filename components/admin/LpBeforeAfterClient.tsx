"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import {
  saveLpBeforeAfterPairAction,
  deleteLpBeforeAfterPairAction,
  toggleLpBeforeAfterPairActiveAction,
} from "@/app/admin/media-actions";
import { uploadLpMediaImage } from "@/lib/supabase/storage";

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

function ImageUploadSlot({
  label,
  imageUrl,
  uploading,
  onSelect,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-2">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted">Nenhuma imagem</span>
          )}
        </div>
        <label className="w-fit cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          {uploading ? "Enviando..." : imageUrl ? "Substituir" : "Enviar imagem"}
          <input type="file" accept="image/*" onChange={onSelect} disabled={uploading} className="hidden" />
        </label>
      </div>
    </Field>
  );
}

export function LpBeforeAfterClient({ pairs }: { pairs: LpBeforeAfterPair[] }) {
  const [editing, setEditing] = useState<Partial<LpBeforeAfterPair> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<"before" | "after" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function startCreate() {
    setEditing(null);
    setBeforeUrl("");
    setAfterUrl("");
    setUploadError(null);
    setShowForm(true);
  }

  function startEdit(pair: LpBeforeAfterPair) {
    setEditing(pair);
    setBeforeUrl(pair.before_image_url);
    setAfterUrl(pair.after_image_url);
    setUploadError(null);
    setShowForm(true);
  }

  async function handleUpload(slot: "before" | "after", e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slot);
    setUploadError(null);

    try {
      const uploaded = await uploadLpMediaImage(file);
      if (slot === "before") setBeforeUrl(uploaded.url);
      else setAfterUrl(uploaded.url);
    } catch (err) {
      console.error("Failed to upload before/after image:", err);
      setUploadError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploadingSlot(null);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Antes/Depois</h1>
          <p className="text-xs text-muted">
            Pares reais de imagem Antes + Depois exibidos na seção &quot;Antes e depois&quot; da
            página inicial. Recomendado: mesma proporção nas duas imagens do par, 1080×1350 (4:5) ou
            1200×1500. Vários pares são permitidos; a ordem segue a posição.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
        >
          + Novo Antes/Depois
        </button>
      </div>

      {showForm && (
        <form
          key={editing?.id ?? "new"}
          action={async (formData) => {
            await saveLpBeforeAfterPairAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          {editing?.id && <input type="hidden" name="id" defaultValue={editing.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ImageUploadSlot
              label="Imagem Antes"
              imageUrl={beforeUrl}
              uploading={uploadingSlot === "before"}
              onSelect={(e) => handleUpload("before", e)}
            />
            <ImageUploadSlot
              label="Imagem Depois"
              imageUrl={afterUrl}
              uploading={uploadingSlot === "after"}
              onSelect={(e) => handleUpload("after", e)}
            />
          </div>
          <input type="hidden" name="before_image_url" value={beforeUrl} readOnly required />
          <input type="hidden" name="after_image_url" value={afterUrl} readOnly required />

          {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Título (opcional)">
              <input
                name="title"
                defaultValue={editing?.title ?? ""}
                placeholder="ex.: Acabamento premium em 30 segundos"
                className={inputClass}
              />
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
              disabled={uploadingSlot !== null || !beforeUrl || !afterUrl}
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

      {pairs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
          Nenhum par cadastrado — a seção &quot;Antes e depois&quot; fica oculta na página inicial
          até o primeiro par ativo.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pairs.map((pair) => (
            <div
              key={pair.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex overflow-hidden rounded-lg border border-border">
                  <div className="h-12 w-12 shrink-0 overflow-hidden border-r border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair.before_image_url} alt="Antes" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-12 w-12 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair.after_image_url} alt="Depois" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  {pair.title && <span className="text-xs font-semibold text-foreground">{pair.title}</span>}
                  <span className="text-xs text-muted">Posição {pair.position}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <form action={toggleLpBeforeAfterPairActiveAction.bind(null, pair.id, !pair.is_active)}>
                  <button
                    type="submit"
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      pair.is_active ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {pair.is_active ? "Ativo" : "Inativo"}
                  </button>
                </form>

                <button
                  onClick={() => startEdit(pair)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground"
                >
                  Editar
                </button>

                <form action={deleteLpBeforeAfterPairAction.bind(null, pair.id)}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm("Remover este par Antes/Depois?")) e.preventDefault();
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

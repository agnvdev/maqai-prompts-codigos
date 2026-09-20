"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type { AdminPromptRow } from "@/lib/supabase/catalog";
import {
  savePromptAction,
  deletePromptAction,
  toggleActiveAction,
  toggleTestedAction,
  setPromptImageAction,
} from "@/app/admin/actions";
import { uploadPromptImage } from "@/lib/supabase/storage";
import { ImageGallery } from "@/components/admin/ImageGallery";
import { ImportPanel } from "@/components/admin/ImportPanel";
import { SEGMENTS, TYPES } from "@/lib/taxonomy";

const FILTERS = [
  "Todos",
  "Máquinas Pesadas",
  "Agro",
  "Mineração",
  "Imagem",
  "Vídeo",
  "Códigos",
  "Combos",
  "Testados",
  "Não testados",
  "Com imagem",
  "Sem imagem",
  "Ativos",
  "Inativos",
] as const;
type FilterValue = (typeof FILTERS)[number];

function matchesFilter(prompt: AdminPromptRow, filter: FilterValue): boolean {
  if (filter === "Todos") return true;
  if (filter === "Máquinas Pesadas" || filter === "Agro" || filter === "Mineração") {
    return prompt.segment === filter;
  }
  if (filter === "Imagem" || filter === "Vídeo") {
    return prompt.type === filter;
  }
  if (filter === "Testados") return prompt.is_tested;
  if (filter === "Não testados") return !prompt.is_tested;
  if (filter === "Com imagem") return !!prompt.image_url;
  if (filter === "Sem imagem") return !prompt.image_url;
  if (filter === "Ativos") return prompt.is_active;
  if (filter === "Inativos") return !prompt.is_active;
  return prompt.tags.includes(filter);
}

function matchesSearch(prompt: AdminPromptRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return prompt.code.toLowerCase().includes(q) || prompt.title.toLowerCase().includes(q);
}

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

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-accent" />
      {label}
    </label>
  );
}

export function AdminPromptsClient({ prompts }: { prompts: AdminPromptRow[] }) {
  const [editing, setEditing] = useState<AdminPromptRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("Todos");

  // Quick "add/replace image" from the list row, without opening the full
  // edit form. Keyed by prompt id so multiple rows have independent state.
  const [quickImageUploadingId, setQuickImageUploadingId] = useState<string | null>(null);
  const [quickImageErrorId, setQuickImageErrorId] = useState<string | null>(null);

  async function handleQuickImageSelect(promptId: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuickImageUploadingId(promptId);
    setQuickImageErrorId(null);

    try {
      const uploaded = await uploadPromptImage(file);
      await setPromptImageAction(promptId, uploaded.url);
    } catch (err) {
      console.error("Failed to set prompt image:", err);
      setQuickImageErrorId(promptId);
    } finally {
      setQuickImageUploadingId(null);
      e.target.value = "";
    }
  }

  function startCreate() {
    setEditing(null);
    setFormImageUrl("");
    setUploadError(null);
    setShowForm(true);
  }

  function startEdit(prompt: AdminPromptRow) {
    setEditing(prompt);
    setFormImageUrl(prompt.image_url ?? "");
    setUploadError(null);
    setShowForm(true);
  }

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const uploaded = await uploadPromptImage(file);
      setFormImageUrl(uploaded.url);
    } catch (err) {
      console.error("Failed to upload prompt image:", err);
      setUploadError("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  const counts = useMemo(() => {
    const map = new Map<FilterValue, number>();
    for (const f of FILTERS) map.set(f, prompts.filter((p) => matchesFilter(p, f)).length);
    return map;
  }, [prompts]);

  const visiblePrompts = useMemo(
    () => prompts.filter((p) => matchesFilter(p, filter) && matchesSearch(p, search)),
    [prompts, filter, search]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-foreground">Catálogo de prompts</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
          >
            Importar prompts
          </button>
          <button
            onClick={() => setShowGallery((v) => !v)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
          >
            Galeria de imagens
          </button>
          <button
            onClick={startCreate}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
          >
            Novo prompt
          </button>
        </div>
      </div>

      {showImport && (
        <ImportPanel onClose={() => setShowImport(false)} onImported={() => setShowImport(false)} />
      )}

      {showGallery && (
        <ImageGallery
          canSelect={showForm}
          onSelect={(url) => {
            if (showForm) setFormImageUrl(url);
          }}
        />
      )}

      {showForm && (
        <form
          key={editing?.id ?? "new"}
          action={async (formData) => {
            await savePromptAction(formData);
            setShowForm(false);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          {editing && <input type="hidden" name="id" defaultValue={editing.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Código">
              <input name="code" defaultValue={editing?.code} required className={inputClass} />
            </Field>
            <Field label="Título">
              <input name="title" defaultValue={editing?.title} required className={inputClass} />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={2}
              className={inputClass}
            />
          </Field>

          <Field label="Texto do prompt">
            <textarea
              name="prompt_text"
              defaultValue={editing?.prompt_text ?? ""}
              rows={4}
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
                  {uploadingImage ? "Enviando..." : formImageUrl ? "Substituir" : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Segmento">
              <select name="segment" defaultValue={editing?.segment ?? "Geral"} className={inputClass}>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select name="type" defaultValue={editing?.type ?? "Imagem"} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tools (separadas por vírgula)">
              <input name="tools" defaultValue={editing?.tools.join(", ")} className={inputClass} />
            </Field>
            <Field label="Tags (separadas por vírgula)">
              <input name="tags" defaultValue={editing?.tags.join(", ")} className={inputClass} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <Checkbox name="featured" label="Destaque" defaultChecked={editing?.featured} />
            <Checkbox name="is_premium" label="Premium" defaultChecked={editing?.is_premium} />
            <Checkbox name="is_tested" label="Testado" defaultChecked={editing?.is_tested} />
            <Checkbox name="is_active" label="Ativo" defaultChecked={editing?.is_active ?? true} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={uploadingImage}
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

      <div className="flex flex-col gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou título..."
          className={inputClass}
        />

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const isActive = f === filter;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={isActive}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {f} ({counts.get(f) ?? 0})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visiblePrompts.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Nenhum prompt encontrado.
          </p>
        )}

        {visiblePrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
                {prompt.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prompt.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-1 text-center text-[9px] font-semibold uppercase leading-tight text-muted">
                    Sem imagem
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="font-mono text-xs text-accent">{prompt.code}</span>
                  <span className="text-sm font-semibold text-foreground">{prompt.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                    {prompt.segment}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                    {prompt.type}
                  </span>
                  {prompt.featured && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                      Destaque
                    </span>
                  )}
                  {prompt.is_premium && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Testado / Ativo: each button is both the visible sim/não
                  status and the quick toggle action for it. */}
              <form action={toggleTestedAction.bind(null, prompt.id, !prompt.is_tested)}>
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    prompt.is_tested ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
                  }`}
                >
                  {prompt.is_tested ? "Testado" : "Não testado"}
                </button>
              </form>

              <form action={toggleActiveAction.bind(null, prompt.id, !prompt.is_active)}>
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    prompt.is_active ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted"
                  }`}
                >
                  {prompt.is_active ? "Ativo" : "Inativo"}
                </button>
              </form>

              <label className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground">
                {quickImageUploadingId === prompt.id
                  ? "Enviando..."
                  : prompt.image_url
                    ? "Substituir imagem"
                    : "Adicionar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={quickImageUploadingId === prompt.id}
                  onChange={(e) => handleQuickImageSelect(prompt.id, e)}
                />
              </label>
              {quickImageErrorId === prompt.id && (
                <span className="text-xs text-red-400">Falha ao enviar.</span>
              )}

              <button
                onClick={() => startEdit(prompt)}
                className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground"
              >
                Editar
              </button>

              <form action={deletePromptAction.bind(null, prompt.id)}>
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm(`Excluir "${prompt.title}"?`)) e.preventDefault();
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
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import type { AdminPromptRow } from "@/lib/supabase/catalog";
import { savePromptAction, deletePromptAction, toggleActiveAction } from "@/app/admin/actions";

const SEGMENTS = ["Geral", "Máquinas Pesadas", "Agro", "Mineração"];
const TYPES = ["Imagem", "Vídeo", "Texto"];

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

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(prompt: AdminPromptRow) {
    setEditing(prompt);
    setShowForm(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Catálogo de prompts</h1>
        <button
          onClick={startCreate}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
        >
          Novo prompt
        </button>
      </div>

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

          <Field label="Imagem (URL)">
            <input name="image_url" defaultValue={editing?.image_url ?? ""} className={inputClass} />
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
            <Checkbox name="is_active" label="Ativo" defaultChecked={editing?.is_active ?? true} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
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

      <div className="flex flex-col gap-2">
        {prompts.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Nenhum prompt cadastrado ainda.
          </p>
        )}

        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-accent">{prompt.code}</span>
              <span className="text-sm font-semibold text-foreground">{prompt.title}</span>
              <span className="text-xs text-muted">
                {prompt.segment} · {prompt.type}
                {prompt.featured ? " · Destaque" : ""}
                {prompt.is_premium ? " · Premium" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
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

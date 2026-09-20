"use client";

import { useState, type ChangeEvent } from "react";
import type { LpMediaSlot } from "@/lib/supabase/lpMedia";
import { saveLpMediaAction, deleteLpMediaAction } from "@/app/admin/media-actions";
import { uploadLpMediaImage } from "@/lib/supabase/storage";

// A single fixed-purpose image upload, bound to one slot+identifier pair
// (both are always known ahead of time by the caller — the admin never
// picks a slot or types an identifier). Saving always upserts on
// (slot, identifier) — the unique constraint lp_media already has — so
// there's no need to track a row id for uploads, only for removal.
export function LpImageUploadSlot({
  slot,
  identifier,
  label,
  imageUrl,
  rowId,
}: {
  slot: LpMediaSlot;
  identifier: string;
  label: string;
  imageUrl: string | null;
  rowId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const uploaded = await uploadLpMediaImage(file);
      const formData = new FormData();
      formData.set("slot", slot);
      formData.set("identifier", identifier);
      formData.set("position", "0");
      formData.set("image_url", uploaded.url);
      formData.set("is_active", "on");
      await saveLpMediaAction(formData);
    } catch (err) {
      console.error(`Failed to upload LP image (${slot}/${identifier}):`, err);
      setError("Falha ao enviar. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove() {
    if (!rowId) return;
    if (!confirm(`Remover a imagem de "${label}"?`)) return;
    try {
      await deleteLpMediaAction(rowId);
    } catch (err) {
      console.error(`Failed to remove LP image (${slot}/${identifier}):`, err);
      setError("Falha ao remover. Tente novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted">Sem imagem</span>
        )}
      </div>

      <span className="text-xs font-semibold text-foreground">{label}</span>

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          {uploading ? "Enviando..." : imageUrl ? "Trocar" : "Adicionar"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        {imageUrl && rowId && (
          <button type="button" onClick={handleRemove} className="text-xs font-medium text-red-400">
            Remover
          </button>
        )}
      </div>

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { listPromptImages, uploadPromptImage, type UploadedImage } from "@/lib/supabase/storage";

export function ImageGallery({
  onSelect,
  canSelect,
}: {
  onSelect: (url: string) => void;
  canSelect: boolean;
}) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPromptImages()
      .then(setImages)
      .catch((err) => {
        console.error("Failed to list prompt images:", err);
        setError("Não foi possível carregar a galeria.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploaded: UploadedImage[] = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadPromptImage(file));
      } catch (err) {
        console.error("Failed to upload image:", err);
        setError(`Falha ao enviar "${file.name}".`);
      }
    }

    setImages((prev) => [...uploaded, ...prev]);
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Galeria de imagens</h2>
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
          {uploading ? "Enviando..." : "Enviar imagens"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {canSelect && (
        <p className="text-xs text-muted">Clique em uma imagem para usá-la no prompt em edição.</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <p className="text-xs text-muted">Carregando...</p>
      ) : images.length === 0 ? (
        <p className="text-xs text-muted">Nenhuma imagem enviada ainda.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {images.map((image) => (
            <button
              key={image.path}
              type="button"
              onClick={() => onSelect(image.url)}
              title={canSelect ? "Usar esta imagem" : "Abra um prompt para associar"}
              className="relative aspect-square overflow-hidden rounded-lg border border-border transition-colors hover:border-accent/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

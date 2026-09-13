import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "prompt-images";

export interface UploadedImage {
  path: string;
  url: string;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadPromptImage(file: File): Promise<UploadedImage> {
  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${randomId()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function listPromptImages(): Promise<UploadedImage[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) throw error;

  return (data ?? [])
    .filter((item) => item.id)
    .map((item) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(item.name);
      return { path: item.name, url: pub.publicUrl };
    });
}

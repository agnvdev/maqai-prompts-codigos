import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const PROMPT_BUCKET = "prompt-images";
const LP_MEDIA_BUCKET = "lp-media";

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

async function uploadToBucket(bucket: string, file: File): Promise<UploadedImage> {
  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${randomId()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function listBucket(bucket: string): Promise<UploadedImage[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(bucket).list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) throw error;

  return (data ?? [])
    .filter((item) => item.id)
    .map((item) => {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(item.name);
      return { path: item.name, url: pub.publicUrl };
    });
}

export function uploadPromptImage(file: File): Promise<UploadedImage> {
  return uploadToBucket(PROMPT_BUCKET, file);
}

export function listPromptImages(): Promise<UploadedImage[]> {
  return listBucket(PROMPT_BUCKET);
}

export function uploadLpMediaImage(file: File): Promise<UploadedImage> {
  return uploadToBucket(LP_MEDIA_BUCKET, file);
}

export function listLpMediaImages(): Promise<UploadedImage[]> {
  return listBucket(LP_MEDIA_BUCKET);
}

// Default per-category/segment/type fallback images are still prompt
// card images, so they share the prompt-images bucket.
export function uploadPromptDefaultImage(file: File): Promise<UploadedImage> {
  return uploadToBucket(PROMPT_BUCKET, file);
}

export function listPromptDefaultImages(): Promise<UploadedImage[]> {
  return listBucket(PROMPT_BUCKET);
}

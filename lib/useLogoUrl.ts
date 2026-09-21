"use client";

import { useEffect, useState } from "react";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";

// Client-side fetch of the same admin-managed logo (lp_media, slot
// "logo") used everywhere else — these auth pages render before any
// server-side data is available to them, same reasoning as
// app/admin/login/page.tsx's own inline version of this fetch (kept
// separate on purpose, not shared with admin code).
export function useLogoUrl(): string | undefined {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getActiveLpMediaMap("logo")
      .then((map) => {
        if (!cancelled) setLogoUrl(map.Logo);
      })
      .catch((error) => console.error("Failed to load logo media:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  return logoUrl;
}

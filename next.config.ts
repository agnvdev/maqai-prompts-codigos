import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseUrl
        ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)]
        : [{ protocol: "https" as const, hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }]),
      // Static placeholder fallbacks (lib/images.ts) until an admin
      // uploads real photos via /admin/media.
      { protocol: "https" as const, hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;

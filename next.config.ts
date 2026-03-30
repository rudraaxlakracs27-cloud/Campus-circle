import type { NextConfig } from "next";

const supabaseStorageHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "techcrunch.com"
      },
      {
        protocol: "https",
        hostname: "www.techcrunch.com"
      },
      ...(supabaseStorageHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseStorageHostname
            }
          ]
        : [])
    ]
  }
};

export default nextConfig;

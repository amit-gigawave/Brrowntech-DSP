import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for "Unauthorized" HMR blocks using the specific dev property.
  allowedDevOrigins: [
    "discounted-genius-diy-solaris.trycloudflare.com",
    "vision-customers-eau-description.trycloudflare.com",
    "surprised-frames-rose-was.trycloudflare.com",
    "localhost:3000"
  ]
};

export default nextConfig;

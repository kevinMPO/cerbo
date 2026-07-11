/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → served by Cloudflare Pages. All pages are client
  // components; the agent API lives in Pages Functions (functions/).
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;

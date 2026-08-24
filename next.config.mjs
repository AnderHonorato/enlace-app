/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Permite compilar numa pasta separada (`npm run build:check`) sem
  // corromper o `.next` de um `npm run dev` que esteja rodando.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;

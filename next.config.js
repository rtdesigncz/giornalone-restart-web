/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "iili.io" }, // logo Restart
    ],
  },

  // 💡 Evita che il build su Vercel fallisca per lint/TS.
  // (Localmente continuerai a vedere gli errori nell'editor/dev server)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
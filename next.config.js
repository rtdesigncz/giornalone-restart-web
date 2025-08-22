/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "iili.io" } // per il logo Restart
    ]
  }
};

module.exports = nextConfig;
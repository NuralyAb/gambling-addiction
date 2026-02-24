/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/support", destination: "/help?tab=chat", permanent: false },
      { source: "/ai-insights", destination: "/progress", permanent: false },
      { source: "/analytics", destination: "/progress", permanent: false },
    ];
  },
};

export default nextConfig;

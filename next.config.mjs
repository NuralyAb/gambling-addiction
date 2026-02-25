import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/support", destination: "/help?tab=chat", permanent: false },
      { source: "/ai-insights", destination: "/progress", permanent: false },
      { source: "/analytics", destination: "/progress", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);

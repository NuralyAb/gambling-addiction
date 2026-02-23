import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#1a1f2e",
          lighter: "#232838",
          card: "#1e2433",
          border: "#2a3040",
        },
        accent: {
          DEFAULT: "#22c55e",
          hover: "#16a34a",
          muted: "rgba(34, 197, 94, 0.1)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

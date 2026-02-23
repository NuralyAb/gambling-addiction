import type { Config } from "tailwindcss";

const config: Config = {
  safelist: ["font-display", "shadow-glow", "shadow-glow-sm", "shadow-card", "shadow-card-hover", "glass", "animate-float"],
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
        display: ["var(--font-outfit)", "Outfit", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.15), transparent 50%)",
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(34, 197, 94, 0.25)",
        "glow-sm": "0 0 24px -8px rgba(34, 197, 94, 0.2)",
        card: "0 4px 24px -4px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 40px -8px rgba(0, 0, 0, 0.4), 0 0 32px -8px rgba(34, 197, 94, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

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
        orange: {
          DEFAULT: "#E8651A",
          dark: "#C4510F",
          light: "#FF8040",
          glow: "rgba(232,101,26,0.3)",
        },
        noir: {
          DEFAULT: "#0A0A0A",
          card: "#141414",
          border: "#1E1E1E",
          hover: "#1A1A1A",
        },
        or: "#FFD700",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      animation: {
        "pulse-orange": "pulse-orange 2s ease-in-out infinite",
        "star-spin": "star-spin 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "slide-up": "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.4s ease forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "particle": "particle 4s ease-out infinite",
      },
      keyframes: {
        "pulse-orange": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(232,101,26,0.3)" },
          "50%": { boxShadow: "0 0 50px rgba(232,101,26,0.7), 0 0 80px rgba(232,101,26,0.3)" },
        },
        "star-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "bounce-in": {
          from: { opacity: "0", transform: "scale(0.7)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "particle": {
          "0%": { transform: "translateY(0) translateX(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-120px) translateX(40px) scale(0)", opacity: "0" },
        },
      },
      backgroundImage: {
        "orange-shimmer": "linear-gradient(90deg, transparent 0%, rgba(232,101,26,0.4) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  // Dark mode is configured but requires manual toggle implementation
  // To enable: Add a button that toggles 'dark' class on document.documentElement
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette - Dark Navy Base
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Game-specific colors (unified palette)
        cyan: {
          DEFAULT: "hsl(var(--game-cyan))",
          dim: "hsl(var(--game-cyan) / 0.15)",
        },
        purple: {
          DEFAULT: "hsl(var(--game-purple))",
          dim: "hsl(var(--game-purple) / 0.15)",
        },
        green: {
          DEFAULT: "hsl(var(--game-green))",
          dim: "hsl(var(--game-green) / 0.15)",
        },
        red: {
          DEFAULT: "hsl(var(--game-red))",
          dim: "hsl(var(--game-red) / 0.15)",
        },
        amber: {
          DEFAULT: "hsl(var(--game-amber))",
          dim: "hsl(var(--game-amber) / 0.15)",
        },
        gold: "hsl(var(--game-gold))",
        // Semantic Risk Zone Colors
        risk: {
          safe: "hsl(var(--risk-safe))",
          caution: "hsl(var(--risk-caution))",
          danger: "hsl(var(--risk-danger))",
          critical: "hsl(var(--risk-critical))",
        },
        // Support Level Colors
        support: {
          negligible: "hsl(var(--support-negligible))",
          emerging: "hsl(var(--support-emerging))",
          growing: "hsl(var(--support-growing))",
          solid: "hsl(var(--support-solid))",
          dominant: "hsl(var(--support-dominant))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "risk-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(239, 68, 68, 0.15)" },
          "50%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "risk-pulse": "risk-pulse 1s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shake: "shake 0.5s ease-in-out",
        float: "float 3s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

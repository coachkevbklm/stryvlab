import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ─── CURSOR DASHBOARD (réf. capture) ─────────────────────────────────
      // Fond #0E0E0E · cartes #161616 · bordures #2A2A2A · accent vert #1F8A65
      colors: {
        background: "#121212",
        surface: "#141414",
        "surface-alt": "#141414",
        "surface-light": "#141414",
        "surface-raised": "#141414",
        dark: "#141414",

        primary: "#EDEDED",
        main: "var(--text-main)",
        "on-dark": "#FFFFFF",
        secondary: "#8A8A8A",
        muted: "#8A8A8A",

        accent: "#1F8A65",
        "accent-hover": "#217356",
        "accent-secondary": "#217356",
        "accent-tertiary": "#1F4637",

        subtle: "#2A2A2A",
        active: "#3F3F3F",

        success: "#1F8A65",
        danger: "#ef4444",
        warning: "#f59e0b",
      },

      borderRadius: {
        card: "12px",
        "card-lg": "16px",
        "card-sm": "8px",
        btn: "6px",
        pill: "9999px",
        input: "6px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },

      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset",
        elevated: "0 8px 24px rgba(0,0,0,0.45)",
        modal: "0 16px 48px rgba(0,0,0,0.55)",
        "focus-field": "0 0 0 1px #1F8A65",
        "glow-accent": "0 0 0 1px rgba(31,138,101,0.4)",
        "inset-surface": "inset 0 1px 0 rgba(255,255,255,0.04)",
        "soft-out": "none",
        "soft-in": "none",
      },
    },
  },

  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* =====================================================
         SYSTÈME CHROMATIQUE (VERROUILLÉ)
         ===================================================== */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shine: {
          '100%': { left: '200%' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        background: '#ededed',
        surface: '#ededed',
        'surface-light': '#f5f5f5',
        accent: '#0e8c5b',
        primary: '#1A1A1A',
        secondary: '#6D6D6D',
        muted: '#0e8c5b',
        chartreuse: '#D4F542',
        'metrics-bg': '#E8EDE8',
        'metrics-dark': '#1C1C1C',
      },

      /* =====================================================
         SYSTÈME DE RAYONS (BORDER-RADIUS)
         ===================================================== */
      borderRadius: {
        card: '24px',
        widget: '18px',
        btn: '12px',
      },

      /* =====================================================
         TYPOGRAPHIE
         ===================================================== */
      fontFamily: {
        sans: ['Lufga', 'sans-serif'],
        unbounded: ['var(--font-unbounded)', 'sans-serif'],
      },

      /* =====================================================
         LUMIÈRE & OMBRES (NEUMORPHISM TECHNIQUE)
         ===================================================== */
      boxShadow: {
        'soft-out': '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
        'soft-in': 'inset 6px 6px 12px #d1d1d1, inset -6px -6px 12px #ffffff',
      }
    },
  },

  plugins: [],
};

export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {

      // ─── SYSTÈME CHROMATIQUE v2.1 ────────────────────────────────────────
      // Crème base + dark islands + acid yellow accent
      // Règle duale : zone crème → texte #1A1A1A | zone dark → texte #FEFEFE + accent #FCF76E
      colors: {
        // Surfaces (du plus clair au plus foncé)
        background:      '#F0EFE7',   // fond principal — crème chaud
        surface:         '#D8D7CE',   // surface de carte standard
        'surface-alt':   '#E2E1D9',   // inputs inactifs, séparateurs
        'surface-raised':'#FEFEFE',   // surélévé — modals, dropdowns
        dark:            '#343434',   // dark island — top bar, panels, KPI dark

        // Typographie
        primary:         '#1A1A1A',   // texte principal (zones claires)
        'on-dark':       '#FEFEFE',   // texte principal (zones sombres)
        secondary:       '#535353',   // texte secondaire (zones claires)
        muted:           '#8A8A85',   // texte tertiaire, labels, meta

        // Accentuation
        accent:          '#FCF76E',   // acid yellow — CTAs, actif, highlight
        'accent-hover':  '#EDE45A',   // accent légèrement assombri (hover)

        // Bordures
        subtle:          '#BCBCB8',   // bordures standard
        active:          '#111111',   // bordures focus / actif

        // Sémantique
        success:         '#22c55e',
        danger:          '#ef4444',
        warning:         '#f59e0b',
      },

      // ─── BORDER RADIUS ───────────────────────────────────────────────────
      borderRadius: {
        card:    '16px',   // cards standard
        btn:     '8px',    // boutons
        pill:    '999px',  // pills, badges, nav tabs
        input:   '8px',    // inputs
      },

      // ─── TYPOGRAPHIE ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      // ─── OMBRES ──────────────────────────────────────────────────────────
      // Système à 4 niveaux : card → elevated → modal → glow
      boxShadow: {
        // Cards légères sur fond crème
        card:      '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)',
        // Surélévé — dropdowns, panels flottants
        elevated:  '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.10)',
        // Modals
        modal:     '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        // Focus input — halo jaune
        'focus-field': '0 0 0 3px rgba(252,247,110,0.35)',
        // Glow accent (bouton primaire)
        'glow-accent': '0 4px 16px rgba(252,247,110,0.40)',
        // Inset — zone chart, input actif
        'inset-surface': 'inset 0 1px 3px rgba(0,0,0,0.08)',
        // Legacy neumorphe — conservé pour composants anciens
        'soft-out': '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
        'soft-in':  'inset 4px 4px 8px #BCBCB8, inset -4px -4px 8px #FEFEFE',
      },

      // ─── ANIMATIONS ──────────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
        'slide-in':       'slide-in 0.2s ease-out',
      },
    },
  },

  plugins: [],
};

export default config;

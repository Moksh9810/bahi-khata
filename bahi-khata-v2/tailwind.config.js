/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      // Literal palette. This config replaces Tailwind's default colours
      // rather than extending them, so any scale not listed here simply does
      // not exist — `bg-slate-50` would silently do nothing. These are the
      // shades the design system actually calls for.
      slate: {
        50: '#F8FAFC',   // app canvas
        100: '#F1F5F9',  // table headers, muted sections
        200: '#E2E8F0',  // dividers, card borders
        300: '#CBD5E1',  // form field borders
        400: '#94A3B8',  // placeholder text
        500: '#64748B',  // secondary text
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A'   // primary text
      },
      blue: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        300: '#93C5FD',
        500: '#3B82F6',  // focus ring is blue-500/20
        600: '#2563EB',  // primary action
        700: '#1D4ED8',  // primary hover
        900: '#1E3A8A'
      },
      emerald: {
        50: '#ECFDF5',   // credit / gain background
        200: '#A7F3D0',  // credit border
        400: '#34D399',
        700: '#047857',  // credit text
        900: '#064E3B'
      },
      rose: {
        50: '#FFF1F2',   // debit / loss background
        200: '#FECDD3',  // debit border
        400: '#FB7185',
        500: '#F43F5E',  // input error border
        600: '#E11D48',
        700: '#BE123C',  // debit text
        800: '#9F1239'
      },
      amber: {
        50: '#FFFBEB',   // pending background
        200: '#FDE68A',  // pending border
        400: '#FBBF24',
        700: '#B45309'   // pending text
      },

      primary: 'rgb(var(--primary) / <alpha-value>)',
      'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
      'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
      'on-primary-container': 'rgb(var(--on-primary-container) / <alpha-value>)',
      secondary: 'rgb(var(--secondary) / <alpha-value>)',
      'on-secondary': 'rgb(var(--on-secondary) / <alpha-value>)',
      'secondary-container': 'rgb(var(--secondary-container) / <alpha-value>)',
      'on-secondary-container': 'rgb(var(--on-secondary-container) / <alpha-value>)',
      tertiary: 'rgb(var(--tertiary) / <alpha-value>)',
      'on-tertiary': 'rgb(var(--on-tertiary) / <alpha-value>)',
      'tertiary-container': 'rgb(var(--tertiary-container) / <alpha-value>)',
      'on-tertiary-container': 'rgb(var(--on-tertiary-container) / <alpha-value>)',
      background: 'rgb(var(--background) / <alpha-value>)',
      'on-background': 'rgb(var(--on-background) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
      'surface-container-lowest': 'rgb(var(--surface-container-lowest) / <alpha-value>)',
      'surface-container-low': 'rgb(var(--surface-container-low) / <alpha-value>)',
      'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
      'surface-container-high': 'rgb(var(--surface-container-high) / <alpha-value>)',
      'surface-container-highest': 'rgb(var(--surface-container-highest) / <alpha-value>)',
      'surface-variant': 'rgb(var(--surface-variant) / <alpha-value>)',
      'on-surface-variant': 'rgb(var(--on-surface-variant) / <alpha-value>)',
      error: 'rgb(var(--error) / <alpha-value>)',
      'on-error': 'rgb(var(--on-error) / <alpha-value>)',
      'error-container': 'rgb(var(--error-container) / <alpha-value>)',
      'on-error-container': 'rgb(var(--on-error-container) / <alpha-value>)',
      outline: 'rgb(var(--outline) / <alpha-value>)',
      'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
      'inverse-surface': 'rgb(var(--inverse-surface) / <alpha-value>)',
      'inverse-on-surface': 'rgb(var(--inverse-on-surface) / <alpha-value>)',
      'inverse-primary': 'rgb(var(--inverse-primary) / <alpha-value>)',
      success: 'rgb(var(--success) / <alpha-value>)',
      'success-glow': 'rgb(var(--success-glow) / <alpha-value>)',
    },
    // NOTE: these live under `extend` so Tailwind's own scales
    // (p-8, py-3, text-sm, rounded-2xl, gap-3 ...) stay available.
    // Putting them at theme root replaced the defaults and stripped all spacing.
    extend: {
    spacing: {
      unit: "8px",
      gutter: "24px",
      "card-gap": "16px",
      "container-padding-mobile": "20px",
      "container-padding-desktop": "40px"
    },
    fontFamily: {
      "data-lg": ["JetBrains Mono"],
      "headline-lg": ["Inter"],
      "label-sm": ["JetBrains Mono"],
      "headline-lg-mobile": ["Inter"],
      "body-md": ["Inter"],
      "display-lg": ["Inter"]
    },
    fontSize: {
      "data-lg": ["20px", { lineHeight: "28px", letterSpacing: "0.02em", fontWeight: "500" }],
      "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
      "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
      "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
      "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
      "headline-md": ["28px", { lineHeight: "36px", letterSpacing: "-0.005em", fontWeight: "600" }],
      "display-md": ["45px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "700" }],
    }
    }
  },
  plugins: [],
}

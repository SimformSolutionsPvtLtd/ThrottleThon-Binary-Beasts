/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #2563EB)',
          secondary: 'var(--brand-secondary, #1E40AF)',
          accent: 'var(--brand-accent, #3B82F6)',
        },
        surface: {
          DEFAULT: 'var(--surface, #0F172A)',
          raised: 'var(--surface-raised, #1E293B)',
          overlay: 'var(--surface-overlay, #334155)',
        },
        content: {
          DEFAULT: 'var(--content, #E2E8F0)',
          muted: 'var(--content-muted, #94A3B8)',
          accent: 'var(--content-accent, #60A5FA)',
        },
      },
    },
  },
  plugins: [],
};

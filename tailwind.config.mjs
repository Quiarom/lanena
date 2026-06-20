/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#01205e',
          ink: '#01205e',
          deep: '#01205e',
          dark: '#01184a',
          night: '#010f30',
          blue: '#1f5dc9',
          sky: '#3aa0e6',
          surface: '#f6f7fb',
          paper: '#fbfbfd',
          line: '#e6e8f0',
          ok: '#0a9a55',
          alert: '#c8232c',
          warn: '#d98a14',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(1,32,94,0.04), 0 12px 32px -16px rgba(1,32,94,0.16)',
        ring: 'inset 0 0 0 1px rgba(1,32,94,0.06)',
        glow: '0 24px 60px -28px rgba(1,32,94,0.55)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-dot': { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.4', transform: 'scale(.85)' } },
        'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up .55s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .45s ease-out both',
        'shimmer': 'shimmer 2.4s linear infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'marquee': 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
};

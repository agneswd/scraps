import type { Config } from 'tailwindcss';

export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f3e8',
          100: '#eee4ca',
          200: '#dec790',
          300: '#cfaa56',
          400: '#bd8d31',
          500: '#8f6623',
          600: '#704c1b',
          700: '#533612',
          800: '#3a240b',
          900: '#221404',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 48px -24px rgba(17, 24, 39, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;

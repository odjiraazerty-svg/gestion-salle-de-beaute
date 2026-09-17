/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8ea',
          100: '#f6efc8',
          200: '#eddca9',
          300: '#e1c372',
          400: '#d7ab45',
          500: '#c5932a',
          600: '#a77321',
          700: '#84531d',
          800: '#6d421d',
          900: '#5c371d',
          950: '#351c0d',
        },
        roseGold: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e1526d',
          600: '#c73352',
          700: '#a6243f',
          800: '#8b2137',
          900: '#752033',
        },
        luxe: {
          bg: '#0F1115',
          card: '#161920',
          border: '#242935',
          lightBg: '#F8F9FC',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-gold': '0 0 25px rgba(215, 171, 69, 0.35)',
        'glow-rose': '0 0 25px rgba(225, 82, 109, 0.35)',
        'mobile-dock': '0 -4px 20px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}

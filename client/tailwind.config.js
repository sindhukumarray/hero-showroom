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
        background: {
          DEFAULT: '#08090C',
          deep: '#040507',
          card: '#101319',
          elevated: '#171B23',
          glass: 'rgba(16, 19, 25, 0.75)',
        },
        surface: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#CED4DA',
          700: '#232834',
          800: '#171B23',
          900: '#101319',
        },
        brand: {
          red: '#E52328',
          'red-hover': '#C7171C',
          'red-glow': 'rgba(229, 35, 40, 0.25)',
          'red-subtle': 'rgba(229, 35, 40, 0.10)',
          silver: '#E2E8F0',
          dark: '#08090C',
          accent: '#FF4D4D',
        },
        border: {
          subtle: '#1F2430',
          DEFAULT: '#2A3142',
          highlight: '#3E475E',
        },
        muted: {
          DEFAULT: '#717B91',
          foreground: '#9DA7BC',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Cabinet Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -4px rgba(229, 35, 40, 0.35)',
        'glow-red-lg': '0 0 45px -4px rgba(229, 35, 40, 0.45)',
        'card-dark': '0 8px 30px -4px rgba(0, 0, 0, 0.65)',
        'card-hover': '0 16px 40px -6px rgba(0, 0, 0, 0.75), 0 0 20px -2px rgba(229, 35, 40, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      borderRadius: {
        'card': '14px',
        'card-lg': '20px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

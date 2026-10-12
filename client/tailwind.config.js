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
          DEFAULT: '#FDFCF9',      // Premium warm ivory / pearl canvas
          deep: '#F4F2ED',         // Soft ivory contrast background
          card: '#FFFFFF',         // Crisp pure white card surface
          elevated: '#FFFFFF',     // Clean elevated surface
          glass: 'rgba(255, 255, 255, 0.88)', // Frosted pearl glass
        },
        surface: {
          50: '#111317',           // Near-black graphite primary headings
          100: '#1E2229',          // Deep graphite body text
          200: '#3D4554',          // High-contrast deep slate secondary text (WCAG AA 9.6:1)
          700: '#E4E7EC',          // Refined light silver borders
          800: '#F2F4F7',          // Soft light surface / pill background
          900: '#F8F9FA',          // Ultra-light surface
          950: '#FFFFFF',          // Pure white card surface
        },
        brand: {
          red: '#ED1C24',          // Hero Red from original reference
          'red-hover': '#D0181F',  // Rich crimson on hover
          'red-glow': 'rgba(237, 28, 36, 0.22)',
          'red-subtle': 'rgba(237, 28, 36, 0.08)',
          silver: '#525B6A',       // Refined slate
          dark: '#111317',         // Deep graphite
          accent: '#E52328',       // Vibrant accent
        },
        border: {
          subtle: '#EEF0F4',       // Whisper-thin border
          DEFAULT: '#E2E6EC',      // Refined neutral light border
          highlight: '#CBD2DC',    // Structured border highlight
        },
        muted: {
          DEFAULT: '#363F4D',      // Strong readable charcoal secondary text (WCAG AA 10.5:1)
          foreground: '#4B5565',   // High-contrast slate tertiary text (WCAG AA 7.5:1)
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Cabinet Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 4px 18px -2px rgba(214, 31, 38, 0.28)',
        'glow-red-lg': '0 8px 30px -4px rgba(214, 31, 38, 0.38)',
        'card-dark': '0 2px 12px -2px rgba(17, 19, 23, 0.05), 0 1px 3px 0 rgba(17, 19, 23, 0.03)',
        'card-hover': '0 16px 36px -8px rgba(17, 19, 23, 0.10), 0 4px 12px -2px rgba(17, 19, 23, 0.04)',
        'glass': '0 8px 32px 0 rgba(17, 19, 23, 0.06)',
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '18px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

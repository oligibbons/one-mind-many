/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', 'sans-serif'],
        heading: ['CustomHeading', 'Quicksand', 'system-ui', 'sans-serif'],
        body: ['Quicksand', 'system-ui', 'sans-serif'],
        custom: ['CustomHeading', 'Quicksand', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand Colors
        brand: {
          navy: '#2C365E',
          charcoal: '#121212',
          orange: '#D65F27',
          cream: '#F5E5C3',
          'pale-yellow': '#FFE19D',
          'shadow-blue': '#1A202C',
          purple: '#6B5589',
          'rusty-red': '#B0413E',
        },
        // Primary colors (mapped to brand orange)
        primary: {
          50: '#FEF7F0',
          100: '#FDEEE1',
          200: '#FADCC3',
          300: '#F7CAA5',
          400: '#F4B887',
          500: '#D65F27', // Brand orange
          600: '#B8501F',
          700: '#9A4117',
          800: '#7C320F',
          900: '#5E2307',
          950: '#401400',
        },
        // Secondary colors (mapped to brand navy)
        secondary: {
          50: '#F4F5F7',
          100: '#E9EBEF',
          200: '#D3D7DF',
          300: '#BDC3CF',
          400: '#A7AFBF',
          500: '#2C365E', // Brand navy
          600: '#243050',
          700: '#1C2A42',
          800: '#142434',
          900: '#0C1E26',
          950: '#041818',
        },
        // Dark colors (mapped to brand charcoal and shadow blue)
        dark: {
          50: '#F5E5C3', // Brand cream
          100: '#E8D5B7',
          200: '#D4C4A8',
          300: '#C0B399',
          400: '#ACA28A',
          500: '#6B5589', // Brand purple
          600: '#1A202C', // Brand shadow blue
          700: '#2C365E', // Brand navy
          800: '#121212', // Brand charcoal
          900: '#0A0A0A',
          950: '#000000',
        },
      },
      animation: {
        'float': 'floating 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(214, 95, 39, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(214, 95, 39, 0.8)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(214, 95, 39, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(214, 95, 39, 0.6)' },
        },
      },
      backgroundImage: {
        'noise': "url('/images/noise.png')",
        'brand-gradient': 'linear-gradient(135deg, #2C365E 0%, #1A202C 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(44, 54, 94, 0.6) 0%, rgba(26, 32, 44, 0.8) 100%)',
      },
      boxShadow: {
        'brand': '0 4px 6px rgba(18, 18, 18, 0.4)',
        'brand-lg': '0 10px 25px rgba(18, 18, 18, 0.6), 0 6px 12px rgba(26, 32, 44, 0.4)',
        'glow': '0 0 20px rgba(255, 225, 157, 0.3)',
        'glow-orange': '0 0 20px rgba(214, 95, 39, 0.4)',
      },
    },
  },
  plugins: [],
};
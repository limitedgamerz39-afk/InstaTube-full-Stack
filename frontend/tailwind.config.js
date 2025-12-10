/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🇮🇳 Tiranga Theme - Inspired by the Indian Flag
        primary: { // Saffron
          50: '#FFF8F0',
          100: '#FFEDD9',
          200: '#FFDAB3',
          300: '#FFC48C',
          400: '#FFAD66',
          500: '#FF9933', // Saffron
          600: '#E68A2E',
          700: '#CC7A29',
          800: '#B36B24',
          900: '#995C1F',
        },
        secondary: { // Green
          50: '#F0FFF4',
          100: '#DAFFE7',
          200: '#B5FFD0',
          300: '#8FFFBA',
          400: '#6AFF9C',
          500: '#45FF7E',
          600: '#138808', // Green
          700: '#107A07',
          800: '#0E6C06',
          900: '#0C5E05',
        },
        accent: { // Blue (Ashoka Chakra)
          50: '#F0F0FF',
          100: '#D9D9FF',
          200: '#B3B3FF',
          300: '#8C8CFF',
          400: '#6666FF',
          500: '#3333FF',
          600: '#0000CC',
          700: '#000099',
          800: '#000080', // Navy Blue
          900: '#00004D',
        },
        info: { // White
          50: '#FFFFFF',
          100: '#F2F2F2',
          200: '#E6E6E6',
          300: '#D9D9D9',
          400: '#CCCCCC',
          500: '#FFFFFF', // White
          600: '#B3B3B3',
          700: '#A6A6A6',
          800: '#999999',
          900: '#8C8C8C',
        },
        success: {
          50: '#E6FFF8',
          100: '#CCFFF1',
          200: '#99FFE3',
          300: '#66FFD5',
          400: '#33FFC7',
          500: '#00F5A0',
          600: '#00C480',
          700: '#009360',
          800: '#006240',
          900: '#003120',
        },
        warning: {
          50: '#FFF8E6',
          100: '#FFF0CC',
          200: '#FFE199',
          300: '#FFD166',
          400: '#FFC233',
          500: '#FFB300',
          600: '#CC8F00',
          700: '#996B00',
          800: '#664700',
          900: '#332400',
        },
        danger: {
          50: '#FFE8E8',
          100: '#FFD1D1',
          200: '#FFA3A3',
          300: '#FF7575',
          400: '#FF4747',
          500: '#FF1919',
          600: '#CC1414',
          700: '#990F0F',
          800: '#660A0A',
          900: '#330505',
        },
        
        // Modern Dark Mode Colors
        dark: {
          bg: '#0A0E1A',
          'bg-secondary': '#121825',
          card: '#1A1F35',
          'card-hover': '#232A45',
          border: '#2D3548',
          'border-light': '#3D4558',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3333FF 0%, #000080 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FF9933 0%, #FFC48C 50%, #B36B24 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #3333FF 0%, #000080 100%)',
        'gradient-success': 'linear-gradient(135deg, #00F5A0 0%, #45FF7E 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1F35 0%, #0A0E1A 100%)',
        'gradient-mesh': 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(19, 136, 8, 0.1) 100%)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(255, 153, 51, 0.4)',
        'glow-lg': '0 0 50px rgba(255, 153, 51, 0.5)',
        'glow-primary': '0 0 30px rgba(255, 153, 51, 0.4)',
        'glow-secondary': '0 0 30px rgba(19, 136, 8, 0.4)',
        'glow-accent': '0 0 30px rgba(0, 0, 128, 0.4)',
        'glow-success': '0 0 30px rgba(0, 245, 160, 0.4)',
        'card': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'card-hover': '0 12px 48px 0 rgba(255, 153, 51, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255, 61, 127, 0.4)' },
          '50%': { boxShadow: '0 0 50px rgba(152, 57, 255, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

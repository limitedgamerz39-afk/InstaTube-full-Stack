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
        // New Vibrant Color Scheme
        primary: '#7C3AED', // Purple
        secondary: '#EC4899', // Pink
        accent: '#F59E0B', // Amber
        success: '#10B981', // Green
        info: '#3B82F6', // Blue
        warning: '#F97316', // Orange
        danger: '#EF4444', // Red
        
        // Custom Gradients
        'gradient-start': '#8B5CF6',
        'gradient-middle': '#EC4899',
        'gradient-end': '#F59E0B',
        
        // Dark mode colors
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
      },
    },
  },
  plugins: [],
}

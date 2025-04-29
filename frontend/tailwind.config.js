// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/AIComponent/**/*.{js,ts,jsx,tsx,css}'
  ],
  theme: {
    extend: {colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      border: 'hsl(var(--border))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      }
    },
    animation: {
      fadeIn: 'fadeIn 0.3s ease-out',
    }
  },
},
  plugins: [],
};
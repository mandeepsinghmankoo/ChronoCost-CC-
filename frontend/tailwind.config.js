/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to right, #110000, #200101, #330000)',
        'gradient-radial': 'radial-gradient(circle at center, #330000, #200101, #110000)',
        'gradient-conic': 'conic-gradient(from 0deg at 50% 50%, #110000, #200101, #330000, #110000)',
      },
      colors: {
        'gradient-start': '#110000',
        'gradient-mid': '#200101',
        'gradient-end': '#330000',
        'theme': {
          50: '#FFE6E6',
          100: '#FFB3B3',
          200: '#FF8080',
          300: '#FF4D4D',
          400: '#FF1A1A',
          500: '#E60000',
          600: '#B30000',
          700: '#800000',
          800: '#4D0000',
          900: '#1A0000',
        }
      },
      boxShadow: {
        theme: '0 4px 14px 0 rgba(255, 0, 0, 0.1)',
        'theme-lg': '0 10px 30px -10px rgba(255, 0, 0, 0.2)'
      }
    },
  },
  plugins: [],
}
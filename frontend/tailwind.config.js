/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeafe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0878F9', // Primary FleetWise Blue
          600: '#0878F9',
          700: '#0660c8',
          800: '#074e9f',
          900: '#0c417e',
          950: '#082852',
          blue: '#0878F9',
          cyan: '#12C9F4', // Accent FleetWise Cyan
        },
        cyan: {
          accent: '#12C9F4',
        },
        navy: {
          800: '#14223d',
          850: '#0d1c36',
          900: '#0a1832',
          950: '#07152E', // Primary FleetWise Deep Navy
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

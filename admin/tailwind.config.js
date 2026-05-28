/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B8D9FF',
          300: '#7EC2FF',
          400: '#40A9FF',
          500: '#0062BE', // Beautiful Tormag Royal Blue matching the logo!
          600: '#0052A3',
          700: '#004385',
          800: '#003366',
          900: '#002244',
          950: '#001122',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

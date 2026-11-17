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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f7',
          500: '#0e8ce8',
          600: '#026fc6',
          700: '#0358a0',
          800: '#074b83',
          900: '#0c3f6e',
          950: '#082849',
        },
        navy: {
          800: '#111e38',
          900: '#0b1329',
          950: '#060a17',
        },
        status: {
          available: '#10b981', // green
          occupied: '#ef4444',  // red
          reserved: '#3b82f6',  // blue
          unavailable: '#6b7280' // grey
        }
      }
    },
  },
  plugins: [],
}


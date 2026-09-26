/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          50: '#f7f4f6',
          100: '#f0e9ed',
          500: '#714B67',
          600: '#5e3e56',
          700: '#4c3245',
          800: '#3a2635',
          900: '#281a25',
        },
        teal: {
          500: '#00A09D',
          600: '#008784',
          700: '#006e6b'
        }
      }
    },
  },
  plugins: [],
}

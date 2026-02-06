/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f0',
        success: '#17c964',
        warning: '#f5a524',
        danger: '#f31260'
      }
    },
  },
  plugins: [],
}

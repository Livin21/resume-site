/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./public/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#14b8a6'
      }
    },
  },
  plugins: [],
}

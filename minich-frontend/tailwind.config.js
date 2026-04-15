/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mini-pink': '#FFE4E1',
        'mini-beige': '#F5F5DC',
        'mini-gray': '#F8F8F8',
        'mini-accent': '#FFB6C1'
      }
    },
  },
  plugins: [],
}
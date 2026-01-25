/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'basketball-orange': '#ff6b35',
        'court-brown': '#8b4513',
      },
    },
  },
  plugins: [],
}

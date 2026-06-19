/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 預先定義黑暗奇幻風格的色系
        'dark-bg': '#121212',
        'blood-red': '#8A0303',
        'rust-brown': '#8B4513',
      }
    },
  },
  plugins: [],
}

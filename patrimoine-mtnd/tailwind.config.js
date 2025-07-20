/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af',
          light: '#3b82f6',
          dark: '#1e3a8a'
        },
        secondary: {
          DEFAULT: '#9ca3af',
          light: '#d1d5db',
          dark: '#6b7280'
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

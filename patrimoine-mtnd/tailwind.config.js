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
          DEFAULT: '#ffffff',
          light: '#f8fafc',
          dark: '#f1f5f9'
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

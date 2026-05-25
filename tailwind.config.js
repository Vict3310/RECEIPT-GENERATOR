/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg-canvas': '#0A0A0A',
        'brand-bg-panel': '#161616',
        'brand-accent': '#3378FF',
        'brand-border': '#262626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderWidth: {
        'thin': '0.5px',
      }
    },
  },
  plugins: [],
}

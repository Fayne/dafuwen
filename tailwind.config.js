/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        felt: { DEFAULT: '#1a3a2a', light: '#234d38', dark: '#0f2318' },
        gold: { DEFAULT: '#c9a84c', light: '#e2c06a', dark: '#a0803a' },
        ivory: { DEFAULT: '#f5ead5', light: '#fdf6ea', dark: '#e8d9b8' },
        mahogany: { DEFAULT: '#3d1c0e', light: '#5a2a14', dark: '#240f08' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Crimson Text"', 'serif'],
        mono: ['"Courier Prime"', 'monospace'],
      }
    }
  },
  plugins: [],
}

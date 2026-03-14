/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#f17022',
        'brand-canvas': '#0a0a0a',
      },
      fontFamily: {
        'serif-display': ['Playfair Display', 'serif'],
        'serif-elegant': ['Bodoni Moda', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

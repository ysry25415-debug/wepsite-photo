/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#1F2937', sand: '#B79B76', mist: '#F7F7F5' },
      boxShadow: { gallery: '0 18px 45px rgba(31, 41, 55, .08)' }
    }
  },
  plugins: []
}

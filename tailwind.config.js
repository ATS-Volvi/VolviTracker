/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        canvas: '#f7f7f5',
        ink: '#1f2328',
        stitch: {
          primary: '#0059a4',
          'primary-container': '#0072ce',
          secondary: '#1960a4',
          tertiary: '#006545',
          'tertiary-container': '#008158',
          surface: '#faf8ff',
        }
      },
    },
  },
  plugins: [],
}

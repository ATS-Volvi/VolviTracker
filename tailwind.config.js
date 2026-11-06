/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: ['1rem', { lineHeight: '1.5rem' }],
        sm: ['1.125rem', { lineHeight: '1.75rem' }],
        base: ['1.25rem', { lineHeight: '1.75rem' }],
        lg: ['1.5rem', { lineHeight: '2rem' }],
        xl: ['1.875rem', { lineHeight: '2.25rem' }],
        '2xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '3xl': ['3rem', { lineHeight: '1.15' }],
        '4xl': ['3.75rem', { lineHeight: '1.1' }],
        '5xl': ['4.5rem', { lineHeight: '1.05' }],
        '6xl': ['6rem', { lineHeight: '1' }],
        '7xl': ['8rem', { lineHeight: '1' }],
      },
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

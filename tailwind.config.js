/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        teal: {
          DEFAULT: '#01696f',
          hover: '#0c4e54',
          50: '#e6f4f4',
          100: '#c2e3e4',
          500: '#01696f',
          600: '#0c4e54',
        },
        background: '#f7f6f2',
        surface: '#ffffff',
        ink: '#28251d',
        muted: '#7a7974',
        income: '#437a22',
        expense: '#a12c7b',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#F5F0E8',
          light: '#FBF8F3',
          dark: '#E8DFD0',
        },
        burgundy: {
          DEFAULT: '#6B1D2A',
          dark: '#4A0E1C',
          light: '#8B3A4A',
          muted: '#946B74',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D4BA6A',
          dark: '#A88B2E',
          muted: '#B89D4A',
        },
        ink: {
          DEFAULT: '#2C1810',
          light: '#6B5B4E',
          muted: '#9B8E82',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1620px',
        },
      },
    },
  },
  plugins: [],
}

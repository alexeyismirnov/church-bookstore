/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D92022',
          dark: '#BB1314',
          light: '#C66263',
        },
        dark: {
          DEFAULT: '#242424',
          deeper: '#24090E',
        },
        background: {
          DEFAULT: '#F3EFE8',
          alt: '#E9E3D8',
        },
        accent: {
          orange: '#FF9901',
          green: '#8DD0A4',
        },
        gray: {
          custom: '#373839',
          light: '#9B9B9B',
          lighter: '#DADADA',
        }
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

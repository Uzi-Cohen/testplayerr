/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050a14',
          900: '#080c18',
          800: '#0d1626',
          700: '#112033',
          600: '#1a3050',
        },
        glow: {
          blue: '#1a9fff',
          bright: '#7ecfff',
        }
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(26, 127, 212, 0.5)',
        'glow-sm': '0 0 10px rgba(26, 127, 212, 0.4)',
        'glow-lg': '0 0 40px rgba(26, 127, 212, 0.6)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-navy': {
          DEFAULT: '#33415C',
          dark: '#1F2737',
          tint: '#EEF1F5',
        },
        'citron-lime': {
          DEFAULT: '#BFD200',
          dark: '#8C9B00',
          tint: '#F7FAE4',
        },
        'vivid-amber': {
          DEFAULT: '#FFA200',
          dark: '#C67C00',
          tint: '#FFF3DF',
        },
        'electric-sky': {
          DEFAULT: '#48CAE4',
          dark: '#0096C7',
          tint: '#EEF9FD',
        },
        'accent-purple': {
          DEFAULT: '#A678B9',
          dark: '#8C5A9F',
          tint: '#F5EEF8',
        },
        blackstone: '#171717',
        canvas: '#FFFDF8',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F4F2EC',
        },
        'border-subtle': '#D9D6CE',
        'text-secondary': '#5B5B5B',
        success: '#237A45',
        danger: '#B42318',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #171717',
        'brutal': '3px 3px 0px #171717',
        'brutal-lg': '4px 4px 0px #171717',
        'brutal-xl': '6px 6px 0px #171717',
        'brutal-purple': '3px 3px 0px #A678B9',
        'brutal-purple-sm': '2px 2px 0px #A678B9',
      },
      borderRadius: {
        'card': '16px',
        'control': '12px',
        'tile': '10px',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Trapvoid', 'Cabinet Grotesk', 'Trap', 'Manrope', 'system-ui', 'sans-serif'],
      },
      zIndex: {
        modal: '60',
      },
    },
  },
  plugins: [],
}

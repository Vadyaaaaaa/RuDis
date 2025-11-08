/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#202225',
          darker: '#1a1b1e',
          darkest: '#0d0e10',
          gray: '#36393f',
          lightgray: '#40444b',
          text: '#dcddde',
          'text-muted': '#72767d',
        },
      },
    },
  },
  plugins: [],
}


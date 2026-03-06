/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lucky-green': '#00FF88',
        'lucky-dark': '#1a1a2e',
        'lucky-card': '#0D1117',
      },
    },
  },
  plugins: [],
}

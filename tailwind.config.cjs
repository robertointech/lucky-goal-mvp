/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy aliases (keep for existing pages during migration)
        'lucky-green': '#00FF88',
        'lucky-dark': '#1a1a2e',
        'lucky-card': '#0D1117',

        // Kinetic Stadium design system
        'primary': '#a4ffb9',
        'primary-container': '#00fd87',
        'primary-dim': '#00ed7e',
        'on-primary': '#006532',
        'on-primary-container': '#005b2c',

        'surface': '#0a0e14',
        'surface-container-low': '#0f141a',
        'surface-container': '#151a21',
        'surface-container-high': '#1b2028',
        'surface-container-highest': '#20262f',
        'surface-bright': '#262c36',
        'surface-variant': '#20262f',

        'on-surface': '#f1f3fc',
        'on-surface-variant': '#a8abb3',
        'on-background': '#f1f3fc',

        'tertiary': '#ff7350',
        'tertiary-container': '#fc3c00',
        'error': '#ff716c',
        'error-container': '#9f0519',

        'secondary': '#e2e0fc',
        'secondary-container': '#45455b',

        'outline': '#72757d',
        'outline-variant': '#44484f',

        'inverse-surface': '#f8f9ff',
        'inverse-primary': '#006e37',
      },
      fontFamily: {
        headline: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        body: ['var(--font-lexend)', 'Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Identity Colors - Sentitive AI / Synapse Aesthetic
        brand: {
          mint: '#C4F3CC',
          'deep-black': '#050505',
          'surface-black': '#121212',
          'surface-grey-dark': '#1B1B1B',
          'surface-grey-light': '#343434',
          'text-primary': '#E9E9E7',
          'text-secondary': '#959595',
          'text-muted': '#525252',
          'border-subtle': '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'input': '12px',
        'modal': '28px',
      },
      fontSize: {
        'h1': ['25px', { letterSpacing: '-0.02em', fontWeight: '400' }],
        'h2': ['18px', { fontWeight: '400' }],
        'label': ['12px', { letterSpacing: '0.05em', textTransform: 'uppercase' }],
      },
    },
  },
  plugins: [],
}

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
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'card': '6px',
        'input': '6px',
        'button': '6px',
        'modal': '8px',
      },
      fontSize: {
        'h1': ['25px', { letterSpacing: '0em', fontWeight: '500', lineHeight: '1.2' }],
        'h2': ['18px', { letterSpacing: '0.0075em', fontWeight: '400', lineHeight: '1.334' }],
        'label': ['12px', { letterSpacing: '0.08333em', fontWeight: '500', textTransform: 'uppercase', lineHeight: '1.66' }],
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

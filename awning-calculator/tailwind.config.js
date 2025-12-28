/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Vercel-inspired color palette
        vercel: {
          // Backgrounds
          'bg-primary': '#000000',
          'bg-secondary': '#0a0a0a',
          'bg-tertiary': '#111111',
          'bg-elevated': '#171717',
          'bg-hover': '#1a1a1a',

          // Borders
          'border': '#1f1f1f',
          'border-hover': '#333333',
          'border-active': '#444444',

          // Text
          'text-primary': '#ededed',
          'text-secondary': '#a1a1a1',
          'text-tertiary': '#666666',

          // Accent colors
          'blue': '#0070f3',
          'blue-hover': '#0060d3',
          'blue-active': '#0050b3',
          'cyan': '#00b4d8',
          'green': '#00dc82',
          'green-dark': '#00b368',
          'red': '#ee5253',
          'red-hover': '#dd4344',
          'yellow': '#fbbf24',
          'purple': '#a855f7',

          // Success/Error/Warning
          'success': '#00dc82',
          'error': '#ee5253',
          'warning': '#fbbf24',
        },
        // Keep brand colors for backward compatibility
        brand: {
          mint: '#00dc82',
          'deep-black': '#000000',
          'surface-black': '#0a0a0a',
          'surface-grey-dark': '#111111',
          'surface-grey-light': '#171717',
          'text-primary': '#ededed',
          'text-secondary': '#a1a1a1',
          'text-muted': '#666666',
          'border-subtle': '#1f1f1f',
          'google-blue': '#0070f3',
          'google-blue-hover': '#0060d3',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
        'input': '6px',
        'button': '6px',
        'modal': '12px',
        'pill': '9999px',
      },
      fontSize: {
        'h1': ['32px', { letterSpacing: '-0.02em', fontWeight: '600', lineHeight: '1.2' }],
        'h2': ['24px', { letterSpacing: '-0.01em', fontWeight: '600', lineHeight: '1.3' }],
        'h3': ['18px', { letterSpacing: '-0.01em', fontWeight: '500', lineHeight: '1.4' }],
        'label': ['12px', { letterSpacing: '0.04em', fontWeight: '500', textTransform: 'uppercase', lineHeight: '1.66' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'vercel': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 112, 243, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 112, 243, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'vercel-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'vercel': '0 4px 8px -2px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'vercel-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        'vercel-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'glow-blue': '0 0 20px rgba(0, 112, 243, 0.3)',
        'glow-green': '0 0 20px rgba(0, 220, 130, 0.3)',
        'glow-red': '0 0 20px rgba(238, 82, 83, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-vercel': 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        'border-gradient': 'linear-gradient(to right, transparent, #333, transparent)',
      },
    },
  },
  plugins: [],
}

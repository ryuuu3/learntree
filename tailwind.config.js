/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#f0f7f0',
          100: '#d9edd9',
          200: '#a8d4a8',
          300: '#72b572',
          400: '#4a9650',
          500: '#2d7a34',
          600: '#1f5e26',
          700: '#16461c',
          800: '#0e2f12',
          900: '#071808',
        },
        soil: {
          50: '#faf6f0',
          100: '#f0e6d3',
          200: '#d9c2a0',
          300: '#c09870',
          400: '#a67248',
          500: '#8a5530',
          600: '#6d3e1e',
          700: '#512c12',
          800: '#361c09',
          900: '#1c0e04',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'grow': 'grow 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        grow: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      }
    },
  },
  plugins: [],
}

const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#09090b',
          panel: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.06)',
          cyan: '#06b6d4',
          red: '#ef4444',
          slate: '#334155',
          green: '#22c55e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'typing': {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'typing': 'typing 0.5s steps(20) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

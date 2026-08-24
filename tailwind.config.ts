import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Named functional palette — NOT tailwind defaults. See Section 3.
        base: '#0B0E13', // graphite-blue background
        panel: '#12161D', // panel surfaces
        hairline: '#232933', // grid lines / dividers / borders
        primary: '#E7EAEE', // text primary
        muted: '#8A93A3', // text muted
        solar: '#E8A33D', // amber — solar only
        battery: '#6C8CFF', // blue-violet — battery only
        grid: '#35C4C1', // teal — grid only
        fault: '#E24C4C', // red — faults/warnings ONLY
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        flow: {
          from: { strokeDashoffset: '0' },
          to: { strokeDashoffset: '-24' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        flow: 'flow 0.6s linear infinite',
        'flow-slow': 'flow 1.2s linear infinite',
        pulse: 'pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

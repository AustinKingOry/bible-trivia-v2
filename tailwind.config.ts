import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#F5C842', dark: '#C49A10', muted: 'rgba(245,200,66,0.15)' },
        navy: { DEFAULT: '#0A1628', mid: '#142240', light: '#1E3360', border: 'rgba(245,200,66,0.2)' },
        emerald: { DEFAULT: '#1A8A4A' },
        crimson: { DEFAULT: '#C0392B' },
        sky: { DEFAULT: '#2E86DE' },
        amber: { DEFAULT: '#E67E22' },
        violet: { DEFAULT: '#7B2FBE' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        turnPulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        toastIn: { from: { transform: 'translateX(110%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
      },
      animation: {
        'slide-up': 'slideUp 0.22s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'turn-pulse': 'turnPulse 1.2s ease-in-out infinite',
        'toast-in': 'toastIn 0.28s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config

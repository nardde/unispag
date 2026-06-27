import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple blue accent scale (#0071E3 = 500)
        brand: {
          50: '#e9f3fe',
          100: '#cfe4fc',
          200: '#a0c9f9',
          300: '#6bacf4',
          400: '#3a90ee',
          500: '#0071e3',
          600: '#0062c4',
          700: '#0853a4',
          800: '#0c4685',
          900: '#0d3a6b',
        },
        // Apple neutrals
        ink: '#1d1d1f', // headings
        subtle: '#6e6e73', // secondary text
        surface: '#f5f5f7', // section backgrounds
        hairline: '#d2d2d7', // faint dividers
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        pill: '980px',
      },
      boxShadow: {
        apple: '0 2px 20px rgba(0,0,0,0.08)',
        'apple-md': '0 6px 30px rgba(0,0,0,0.10)',
        'apple-lg': '0 12px 48px rgba(0,0,0,0.14)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.2s ease both',
      },
    },
  },
  plugins: [],
};

export default config;

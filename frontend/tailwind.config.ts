import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#0d1224',
          700: '#111828',
          600: '#1a2340',
        },
        brand: {
          purple: '#7c3aed',
          violet: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

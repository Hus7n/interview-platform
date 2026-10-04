import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9edff',
          200: '#b9ddff',
          300: '#8ec8ff',
          400: '#52a8ff',
          500: '#52a8ff',
          DEFAULT: '#52a8ff',
          600: '#2f8fe6',
          700: '#2674b8',
          800: '#1f5c93',
          900: '#1c4d7a',
          glow: '#52a8ff',
        },
        primary: {
          DEFAULT: '#52a8ff',
          dark: '#2f8fe6',
          light: '#8ec8ff',
        },
        ink: '#000000',
        panel: '#0a0a0a',
        chip: '#1f1f1f',
        accent: {
          DEFAULT: '#52a8ff',
          blue: '#52a8ff',
          green: '#62c073',
          cyan: '#52a8ff',
          emerald: '#62c073',
          amber: '#f5b544',
          rose: '#f43f5e',
          purple: '#a78bfa',
        },
        success: '#62c073',
        metric: '#999999',
        onwhite: '#121212',
        surface: {
          DEFAULT: '#000000',
          light: '#0a0a0a',
          dark: '#000000',
          card: '#0a0a0a',
          hover: '#141414',
        },
        line: 'rgba(255, 255, 255, 0.145)',
        muted: {
          DEFAULT: '#999999',
          dark: '#666666',
          light: '#d4d4d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Inter Display"', '"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(82, 168, 255, 0.3)',
        'glow-md': '0 0 25px -5px rgba(82, 168, 255, 0.4)',
        'glow-lg': '0 0 40px -8px rgba(82, 168, 255, 0.5)',
        'glow-cyan': '0 0 25px -5px rgba(82, 168, 255, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(98, 192, 115, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;

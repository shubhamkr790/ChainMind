/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ChainMind Brand Colors
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Neon accent colors for Web3 aesthetic  
        neon: {
          blue: '#00d4ff',
          violet: '#8b5cf6', 
          green: '#00ff88',
          pink: '#ff0080',
          yellow: '#ffff00',
        },
        // Dark theme grays
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db', 
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Status colors
        success: '#10b981',
        warning: '#f59e0b', 
        error: '#ef4444',
        info: '#3b82f6',
        // Background and surface colors
        background: {
          primary: '#0a0a0b',
          secondary: '#111827', 
          tertiary: '#1f2937',
        },
        surface: {
          primary: '#1f2937',
          secondary: '#374151',
          tertiary: '#4b5563',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // Glassmorphism shadows
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 45px -12px rgba(0, 0, 0, 0.25)',
        // Neon glow effects
        'neon-blue': '0 0 20px #00d4ff',
        'neon-violet': '0 0 20px #8b5cf6', 
        'neon-green': '0 0 20px #00ff88',
        'neon-pink': '0 0 20px #ff0080',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1', 
            transform: 'translateY(0)'
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)'
          },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px #0ea5e9' },
          '100%': { boxShadow: '0 0 30px #38bdf8, 0 0 40px #7dd3fc' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)',
        'gradient-neon': 'linear-gradient(90deg, #00d4ff 0%, #8b5cf6 50%, #ff0080 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

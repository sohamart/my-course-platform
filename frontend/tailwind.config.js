/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#111111',
          offwhite: '#F5F5F5',
          lavender: '#DCDCFB',
          'lavender-dark': '#B8B8F0',
          mint: '#DDF5E5',
          'mint-dark': '#B4E8C2',
          iceblue: '#DFF3F8',
          'iceblue-dark': '#BAE4F0',
          text: '#17171B',
          muted: '#65657D',
        }
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(75, 70, 130, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-hover': '0 14px 40px 0 rgba(75, 70, 130, 0.14), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
        'droplet': 'inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(0, 0, 0, 0.08), 2px 4px 10px rgba(0, 0, 0, 0.1)',
        'glow-lavender': '0 0 25px -5px rgba(220, 220, 251, 0.7)',
        'glow-mint': '0 0 25px -5px rgba(221, 245, 229, 0.7)',
        'glow-iceblue': '0 0 25px -5px rgba(223, 243, 248, 0.7)',
      },
      animation: {
        'float-slow': 'float 7s ease-in-out infinite',
        'float-medium': 'float 5s ease-in-out infinite',
        'float-fast': 'float 3.5s ease-in-out infinite',
        'wave-slow': 'wave 18s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-25%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}


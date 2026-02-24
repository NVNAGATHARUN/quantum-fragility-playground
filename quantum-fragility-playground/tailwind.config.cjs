/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020209',
        surface: '#080818',
        'surface-raised': '#0d0d24',
        brand: {
          border: 'rgba(99, 102, 241, 0.15)',
          'border-hover': 'rgba(99, 102, 241, 0.40)',
          primary: '#6366f1',
          cyan: '#22d3ee',
          purple: '#a78bfa',
          green: '#10b981',
          gold: '#f59e0b',
          red: '#ef4444',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        }
      },
      fontFamily: {
        orbitron: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '64': '64px',
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        'premium': '0 4px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}

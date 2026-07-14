/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: '#fff0f2', // very subtle red-tinted white to replace pure white
        s0: '#0a0506',   // deep background
        s1: '#140a0c',   // surface
        s2: '#211215',   // elevated
        s3: '#4a3338',   // muted
        s4: '#a38a90',   // body text
        s5: '#ffe4e6',   // primary text
        accent: '#e11d48', // deep rose-crimson accent
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'monospace'],
        body:    ['var(--font-outfit)', 'sans-serif'],
        mono:    ['var(--font-space-mono)', 'monospace'],
      },
      backgroundImage: {
        'depth': 'linear-gradient(180deg,#0a0506 0%,#140a0c 100%)',
        'surface': 'linear-gradient(135deg,#140a0c 0%,#211215 100%)',
      },
      boxShadow: {
        'depth-sm': '0 2px 8px rgba(0,0,0,0.5),0 1px 2px rgba(0,0,0,0.7)',
        'depth':    '0 8px 32px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.8)',
        'depth-lg': '0 24px 64px rgba(0,0,0,0.7),0 8px 24px rgba(0,0,0,0.9)',
        'inset-top':'inset 0 1px 0 rgba(204,208,207,0.06)',
      },
      animation: {
        'fade-in':    'fadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'film':       'film 0.8s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeIn:    { from:{ opacity:'0' }, to:{ opacity:'1' } },
        slideUp:   { from:{ opacity:'0', transform:'translateY(32px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideDown: { from:{ opacity:'0', transform:'translateY(-20px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        scaleIn:   { from:{ opacity:'0', transform:'scale(0.92)' }, to:{ opacity:'1', transform:'scale(1)' } },
        shimmer:   { '0%':{ backgroundPosition:'200% 0' }, '100%':{ backgroundPosition:'-200% 0' } },
        pulseSoft: { '0%,100%':{ opacity:'0.5' }, '50%':{ opacity:'1' } },
        film: {
          from:{ opacity:'0', transform:'translateY(40px) scale(0.96)' },
          to:  { opacity:'1', transform:'translateY(0)   scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

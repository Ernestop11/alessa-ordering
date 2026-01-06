/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}', // Include lib folder for template-renderer classes
  ],
  // Safelist dynamic classes used in template-renderer.ts
  safelist: [
    // Card style classes - dark-red
    'bg-gradient-to-br',
    'from-stone-900',
    'to-stone-950',
    'border-red-900/30',
    'hover:shadow-red-900/20',
    // Card style classes - dark-elevated
    'bg-stone-900/90',
    'backdrop-blur-sm',
    'border-stone-700/50',
    'shadow-2xl',
    'hover:shadow-3xl',
    // Card style classes - elevated
    'bg-white/10',
    'backdrop-blur-md',
    'border-white/20',
    // Card style classes - glass
    'bg-white/5',
    'backdrop-blur-lg',
    'border-white/10',
    // Card style classes - solid
    'bg-stone-800',
    'border-stone-700',
    // Glow classes
    'shadow-glow',
    'hover:shadow-glow-lg',
    'transition-shadow',
    'duration-300',
    // Animation classes
    'animate-fadeInUp',
    'animate-fadeIn',
    'animate-slideUp',
    'animate-shimmer',
    'animate-gradient-shift',
    'animate-aurora',
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
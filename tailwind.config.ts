import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        // Fade
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-left': { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'fade-in-right': { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'fade-in-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-down': { from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-scale': { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
        // Slide
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'slide-down': { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(0)' } },
        'slide-left': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-right': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        // Zoom
        'zoom-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'zoom-out': { from: { opacity: '0', transform: 'scale(1.1)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'zoom-in-down': { '0%': { opacity: '0', transform: 'scale(0.95) translateY(-20px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        'zoom-in-up': { '0%': { opacity: '0', transform: 'scale(0.95) translateY(20px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        'zoom-in-left': { '0%': { opacity: '0', transform: 'scale(0.95) translateX(-20px)' }, '100%': { opacity: '1', transform: 'scale(1) translateX(0)' } },
        'zoom-in-right': { '0%': { opacity: '0', transform: 'scale(0.95) translateX(20px)' }, '100%': { opacity: '1', transform: 'scale(1) translateX(0)' } },
        // Bounce
        'bounce-in': { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'bounce-in-up': { '0%': { opacity: '0', transform: 'translateY(40px)' }, '60%': { opacity: '1', transform: 'translateY(-8px)' }, '80%': { transform: 'translateY(3px)' }, '100%': { transform: 'translateY(0)' } },
        'bounce-in-down': { '0%': { opacity: '0', transform: 'translateY(-40px)' }, '60%': { opacity: '1', transform: 'translateY(8px)' }, '80%': { transform: 'translateY(-3px)' }, '100%': { transform: 'translateY(0)' } },
        'bounce-in-left': { '0%': { opacity: '0', transform: 'translateX(-40px)' }, '60%': { opacity: '1', transform: 'translateX(8px)' }, '80%': { transform: 'translateX(-3px)' }, '100%': { transform: 'translateX(0)' } },
        'bounce-in-right': { '0%': { opacity: '0', transform: 'translateX(40px)' }, '60%': { opacity: '1', transform: 'translateX(-8px)' }, '80%': { transform: 'translateX(3px)' }, '100%': { transform: 'translateX(0)' } },
        // Flip / 3D
        'flip-x': { '0%': { transform: 'rotateX(0deg)' }, '100%': { transform: 'rotateX(360deg)' } },
        'flip-y': { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(360deg)' } },
        'flip-x-in': { '0%': { opacity: '0', transform: 'rotateX(90deg)' }, '100%': { opacity: '1', transform: 'rotateX(0deg)' } },
        'flip-y-in': { '0%': { opacity: '0', transform: 'rotateY(90deg)' }, '100%': { opacity: '1', transform: 'rotateY(0deg)' } },
        'perspective-up': { '0%': { opacity: '0', transform: 'perspective(600px) translateZ(-200px) rotateX(30deg)' }, '100%': { opacity: '1', transform: 'perspective(600px) translateZ(0) rotateX(0deg)' } },
        'perspective-down': { '0%': { opacity: '0', transform: 'perspective(600px) translateZ(-200px) rotateX(-30deg)' }, '100%': { opacity: '1', transform: 'perspective(600px) translateZ(0) rotateX(0deg)' } },
        'three-d-tilt': { '0%, 100%': { transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' }, '25%': { transform: 'perspective(800px) rotateX(-5deg) rotateY(5deg)' }, '75%': { transform: 'perspective(800px) rotateX(5deg) rotateY(-5deg)' } },
        'card-flip': { '0%': { transform: 'perspective(800px) rotateY(0deg)' }, '50%': { transform: 'perspective(800px) rotateY(180deg)' }, '100%': { transform: 'perspective(800px) rotateY(360deg)' } },
        // Attention
        'pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.8' } },
        'shake': { '0%, 100%': { transform: 'translateX(0)' }, '10%, 50%, 90%': { transform: 'translateX(-4px)' }, '30%, 70%': { transform: 'translateX(4px)' } },
        'shake-x': { '0%, 100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-8px)' }, '40%': { transform: 'translateX(8px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
        'swing': { '0%, 100%': { transform: 'rotate(0deg)' }, '20%': { transform: 'rotate(12deg)' }, '40%': { transform: 'rotate(-8deg)' }, '60%': { transform: 'rotate(4deg)' }, '80%': { transform: 'rotate(-2deg)' } },
        'wobble': { '0%, 100%': { transform: 'translateX(0) rotate(0deg)' }, '15%': { transform: 'translateX(-6px) rotate(-3deg)' }, '30%': { transform: 'translateX(3px) rotate(2deg)' }, '45%': { transform: 'translateX(-3px) rotate(-1deg)' }, '60%': { transform: 'translateX(2px) rotate(1deg)' }, '75%': { transform: 'translateX(-1px) rotate(0deg)' } },
        'jello': { '0%, 100%': { transform: 'scale3d(1,1,1)' }, '30%': { transform: 'scale3d(1.25,0.75,1)' }, '40%': { transform: 'scale3d(0.75,1.25,1)' }, '50%': { transform: 'scale3d(1.15,0.85,1)' }, '65%': { transform: 'scale3d(0.95,1.05,1)' }, '75%': { transform: 'scale3d(1.05,0.95,1)' } },
        'glow': { '0%, 100%': { boxShadow: '0 0 5px 2px rgba(75, 197, 255, 0.3)' }, '50%': { boxShadow: '0 0 20px 6px rgba(75, 197, 255, 0.6)' } },
        'float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'bounce-loop': { '0%, 100%': { transform: 'translateY(0)' }, '25%': { transform: 'translateY(-8px)' }, '50%': { transform: 'translateY(0)' }, '75%': { transform: 'translateY(-4px)' } },
        'ping-soft': { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)' } },
        'heartbeat': { '0%, 100%': { transform: 'scale(1)' }, '15%': { transform: 'scale(1.15)' }, '30%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.1)' }, '60%': { transform: 'scale(1)' } },
        // Motion (non-standard, for reference / framer-motion fallback)
        'reveal': { '0%': { clipPath: 'inset(0 100% 0 0)' }, '100%': { clipPath: 'inset(0 0% 0 0)' } },
        'blur-in': { '0%': { opacity: '0', filter: 'blur(12px)' }, '100%': { opacity: '1', filter: 'blur(0)' } },
        'mask-in': { '0%': { WebkitMaskPosition: '200% 0', maskPosition: '200% 0' }, '100%': { WebkitMaskPosition: '0% 0', maskPosition: '0% 0' } },
        // Emphasis
        'scale-up': { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(1.05)' } },
        'scale-down': { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(0.95)' } },
        // Footer-specific
        'reveal-up': { '0%': { opacity: '0', transform: 'translateY(30px)', clipPath: 'inset(100% 0 0 0)' }, '100%': { opacity: '1', transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' } },
        'drop-in': { '0%': { opacity: '0', transform: 'translateY(-30px)' }, '60%': { opacity: '1', transform: 'translateY(4px)' }, '80%': { transform: 'translateY(-2px)' }, '100%': { transform: 'translateY(0)' } },
        'expand-in': { '0%': { opacity: '0', transform: 'scaleX(0)' }, '100%': { opacity: '1', transform: 'scaleX(1)' } },
        'border-pulse': { '0%, 100%': { borderColor: 'hsl(var(--border))' }, '50%': { borderColor: 'hsl(var(--primary))' } },
        'color-cycle': { '0%, 100%': { color: 'hsl(var(--foreground))' }, '33%': { color: 'hsl(var(--primary))' }, '66%': { color: 'hsl(var(--accent-foreground))' } },
        'slide-up-blur': { '0%': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' } },
        'vibrate': { '0%, 100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-2px)' }, '40%': { transform: 'translateX(2px)' }, '60%': { transform: 'translateX(-1px)' }, '80%': { transform: 'translateX(1px)' } },
        'clip-in': { '0%': { clipPath: 'inset(0 0 100% 0)' }, '100%': { clipPath: 'inset(0 0 0 0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Fade
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-in-left': 'fade-in-left 0.5s ease-out both',
        'fade-in-right': 'fade-in-right 0.5s ease-out both',
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'fade-in-down': 'fade-in-down 0.5s ease-out both',
        'fade-in-scale': 'fade-in-scale 0.5s ease-out both',
        // Slide
        'slide-up': 'slide-up 0.5s ease-out both',
        'slide-down': 'slide-down 0.5s ease-out both',
        'slide-left': 'slide-left 0.5s ease-out both',
        'slide-right': 'slide-right 0.5s ease-out both',
        // Zoom
        'zoom-in': 'zoom-in 0.5s ease-out both',
        'zoom-out': 'zoom-out 0.5s ease-out both',
        'zoom-in-down': 'zoom-in-down 0.5s ease-out both',
        'zoom-in-up': 'zoom-in-up 0.5s ease-out both',
        'zoom-in-left': 'zoom-in-left 0.5s ease-out both',
        'zoom-in-right': 'zoom-in-right 0.5s ease-out both',
        // Bounce
        'bounce-in': 'bounce-in 0.6s ease-out both',
        'bounce-in-up': 'bounce-in-up 0.6s ease-out both',
        'bounce-in-down': 'bounce-in-down 0.6s ease-out both',
        'bounce-in-left': 'bounce-in-left 0.6s ease-out both',
        'bounce-in-right': 'bounce-in-right 0.6s ease-out both',
        // Flip / 3D
        'flip-x': 'flip-x 0.8s ease-in-out both',
        'flip-y': 'flip-y 0.8s ease-in-out both',
        'flip-x-in': 'flip-x-in 0.6s ease-out both',
        'flip-y-in': 'flip-y-in 0.6s ease-out both',
        'perspective-up': 'perspective-up 0.7s ease-out both',
        'perspective-down': 'perspective-down 0.7s ease-out both',
        'three-d-tilt': 'three-d-tilt 2s ease-in-out infinite',
        'card-flip': 'card-flip 1s ease-in-out',
        // Attention
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shake': 'shake 0.6s ease-in-out',
        'shake-x': 'shake-x 0.8s ease-in-out',
        'swing': 'swing 0.8s ease-in-out',
        'wobble': 'wobble 0.8s ease-in-out',
        'jello': 'jello 0.8s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 2.5s ease-in-out infinite',
        'bounce-loop': 'bounce-loop 1s ease-in-out infinite',
        'ping-soft': 'ping-soft 1.5s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        // Motion
        'reveal': 'reveal 0.6s ease-out both',
        'blur-in': 'blur-in 0.5s ease-out both',
        'mask-in': 'mask-in 0.6s ease-out both',
        // Emphasis
        'scale-up': 'scale-up 0.3s ease-out both',
        'scale-down': 'scale-down 0.3s ease-out both',
        // Footer-specific
        'reveal-up': 'reveal-up 0.6s ease-out both',
        'drop-in': 'drop-in 0.6s ease-out both',
        'expand-in': 'expand-in 0.5s ease-out both',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'color-cycle': 'color-cycle 3s ease-in-out infinite',
        'slide-up-blur': 'slide-up-blur 0.6s ease-out both',
        'vibrate': 'vibrate 0.3s ease-in-out',
        'clip-in': 'clip-in 0.6s ease-out both',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('tailwindcss/plugin')(function({ addUtilities }) {
      addUtilities({
        '.inset-shadow': {
          boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.5) inset, -2px -2px 2px rgba(255, 255, 255, 0.1) inset, -2px -2px 2px rgba(255, 255, 255, 0.1), 2px 2px 2px rgba(0, 0, 0, 0.5)',
        },
      });
    }),
  ],
} satisfies Config;

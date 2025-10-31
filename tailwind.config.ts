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
        headline: ['Inter', 'sans-serif'],
        code: ['"Source Code Pro"', 'monospace'],
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
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        glitch: {
            '0%, 100%': { transform: 'translate(0, 0) skew(0deg)', opacity: '1' },
            '25%': { transform: 'translate(5px, -5px) skew(1deg)', opacity: '.85' },
            '50%': { transform: 'translate(-5px, 5px) skew(-1deg)', opacity: '.75' },
            '75%': { transform: 'translate(5px, 5px) skew(1deg)', opacity: '.85' },
        },
        'super-glitch': {
            '0%': { transform: 'translate(0,0) skew(0deg)', filter: 'none' },
            '10%': { transform: 'translate(-10px,-5px) skew(2deg)', filter: 'url(#chromatic-aberration-filter-1)' },
            '20%': { transform: 'translate(5px,10px) skew(-1deg)', opacity: 0.8 },
            '30%': { transform: 'translate(-15px,8px) skew(3deg)' },
            '40%': { transform: 'translate(10px,-3px) skew(-2deg)', opacity: 0.9 },
            '50%': { transform: 'translate(0,0) skew(0deg)', clipPath: 'inset(40% 0 40% 0)' },
            '60%': { transform: 'translate(-10px,10px) skew(-3deg)', opacity: 0.7 },
            '70%': { transform: 'translate(15px,-5px) skew(1deg)' },
            '80%': { transform: 'translate(5px,5px) skew(-1deg)', filter: 'url(#chromatic-aberration-filter-0)' },
            '90%': { transform: 'translate(-5px,-10px) skew(2deg)', clipPath: 'none' },
            '100%': { transform: 'translate(0,0) skew(0deg)' },
        },
        'ping-freeze': {
            '0%': { filter: 'none' },
            '10%': { filter: 'contrast(1.5)' },
            '20%': { filter: 'contrast(1) blur(0.5px)' },
            '100%': { filter: 'contrast(1) blur(0.5px)' },
        },
        'glitch-long': {
            '0%': { transform: 'translate(0,0) skew(0deg)' },
            '10%': { transform: 'translate(-5px,-5px) skew(1deg)' },
            '20%': { transform: 'translate(5px,5px) skew(-1deg)' },
            '30%': { transform: 'translate(-7px,3px) skew(2deg)' },
            '40%': { transform: 'translate(7px,-3px) skew(-2deg)' },
            '50%': { transform: 'translate(-5px,7px) skew(1deg)' },
            '60%': { transform: 'translate(5px,-7px) skew(-1deg)' },
            '70%': { transform: 'translate(-7px,-3px) skew(2deg)' },
            '80%': { transform: 'translate(7px,3px) skew(-2deg)' },
            '90%': { transform: 'translate(-5px,-5px) skew(1deg)' },
            '100%': { transform: 'translate(0,0) skew(0deg)' },
        },
        'screen-tear': {
            '0%': { clipPath: 'inset(0 0 0 0)' },
            '20%': { clipPath: 'inset(10% 0 15% 0)' },
            '40%': { clipPath: 'inset(5% 0 20% 0)' },
            '60%': { clipPath: 'inset(25% 0 5% 0)' },
            '80%': { clipPath: 'inset(15% 0 10% 0)' },
            '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        'chromatic-aberration': {
            '0%, 100%': { filter: 'url(#chromatic-aberration-filter-0)' },
            '50%': { filter: 'url(#chromatic-aberration-filter-1)' },
        },
        'glitch-short': {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '25%': { transform: 'translate(2px, -2px)', opacity: '.75' },
          '50%': { transform: 'translate(-2px, 2px)', opacity: '.5' },
          '75%': { transform: 'translate(2px, 2px)', opacity: '.75' },
          '100%': { transform: 'translate(-2px, -2px)', opacity: '1' },
        },
        typing: {
            from: { width: '0' },
            to: { width: '100%' }
        },
        blink: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0' }
        },
        scream: {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
            '5%': { transform: 'scale(1.1) translate(-5px, 5px)', opacity: 1 },
            '10%': { transform: 'scale(1)', opacity: 0.9 },
            '80%': { transform: 'scale(1.5)', opacity: 0.2 },
            '90%': { opacity: 0.1 },
        },
        lag: {
            '0%, 100%': { opacity: 1, filter: 'none' },
            '50%': { opacity: 0.6, filter: 'blur(1px) contrast(2)' },
        },
        'image-deform': {
            '0%, 100%': { transform: 'scale(1)', filter: 'url(#chromatic-aberration-filter-0)' },
            '20%': { transform: 'scale(1.02) skewX(2deg)', filter: 'url(#chromatic-aberration-filter-1)' },
            '50%': { clipPath: 'inset(20% 0 30% 0)' },
            '80%': { transform: 'scale(0.98) skewX(-2deg)', filter: 'none' },
        },
        'pulse-strong': {
            '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0.7)' },
            '50%': { boxShadow: '0 0 0 8px hsl(var(--accent) / 0)' },
        },
        'red-screen': {
          '0%': { backgroundColor: 'transparent', filter: 'invert(0)'},
          '50%': { backgroundColor: 'hsl(var(--destructive) / 0.7)', filter: 'invert(1)'},
          '100%': { backgroundColor: 'transparent', filter: 'invert(0)'},
        },
        'die-spam': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '5%': { transform: 'scale(1.2) translate(10px, -5px)', opacity: 0.8 },
          '10%': { transform: 'scale(0.9) translate(-10px, 5px)', opacity: 1 },
          '15%': { transform: 'scale(1.1)', opacity: 0.9 },
          '20%, 80%': { opacity: 1, textShadow: '0 0 20px #f00, 0 0 40px #f00, 0 0 60px #f00' },
          '100%': { opacity: 1, transform: 'scale(3)', filter: 'blur(5px)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glitch': 'glitch 0.4s linear infinite alternate',
        'glitch-short': 'glitch-short 0.2s linear',
        'glitch-long': 'glitch-long 1s linear infinite alternate',
        'typing': 'typing 1s steps(20, end), blink .75s step-end infinite',
        'blink': 'blink 1s step-end infinite',
        'scream': 'scream 0.7s ease-out forwards',
        'lag': 'lag 1.5s linear infinite alternate',
        'screen-tear': 'screen-tear 0.5s ease-in-out infinite alternate',
        'chromatic-aberration': 'chromatic-aberration 1s steps(1, end) infinite',
        'image-deform': 'image-deform 4s ease-in-out forwards, screen-tear 2s ease-in-out infinite alternate',
        'pulse-strong': 'pulse-strong 2s infinite',
        'red-screen': 'red-screen 1.5s ease-in-out forwards',
        'die-spam': 'die-spam 0.5s linear infinite',
        'ping-freeze': 'ping-freeze 10s ease-in-out forwards',
        'super-glitch': 'super-glitch 1.5s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

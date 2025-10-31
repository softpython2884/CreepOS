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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glitch': 'glitch 0.4s linear infinite alternate',
        'glitch-short': 'glitch-short 0.2s linear',
        'typing': 'typing 1s steps(20, end), blink .75s step-end infinite',
        'blink': 'blink 1s step-end infinite',
        'scream': 'scream 0.7s ease-out forwards',
        'lag': 'lag 1.5s linear infinite alternate',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

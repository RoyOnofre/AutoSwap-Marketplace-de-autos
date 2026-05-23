export const colors = {
  primary: {
    DEFAULT: 'hsl(210, 100%, 45%)', // Electric Sapphire
    600: 'hsl(210, 100%, 45%)',
    500: 'hsl(210, 100%, 55%)',
    400: 'hsl(210, 100%, 65%)',
  },
  secondary: {
    DEFAULT: 'hsl(210, 5%, 20%)', // Graphite Dark
    500: 'hsl(210, 5%, 20%)',
    600: 'hsl(210, 5%, 15%)',
    400: 'hsl(210, 5%, 25%)',
  },
  accent: {
    DEFAULT: 'hsl(140, 70%, 45%)', // Emerald Green
    500: 'hsl(140, 70%, 45%)',
    600: 'hsl(140, 70%, 35%)',
    400: 'hsl(140, 70%, 55%)',
  },
  neutral: {
    100: 'hsl(0, 0%, 100%)',
    200: 'hsl(0, 0%, 95%)',
    300: 'hsl(0, 0%, 90%)',
    400: 'hsl(0, 0%, 70%)',
    500: 'hsl(0, 0%, 50%)',
    600: 'hsl(0, 0%, 30%)',
    700: 'hsl(0, 0%, 15%)',
    800: 'hsl(0, 0%, 5%)',
  },
};

export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['"Roboto Mono"', 'monospace'],
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export type Theme = typeof colors & typeof fontFamily & typeof breakpoints & typeof spacing;

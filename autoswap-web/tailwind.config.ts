import type { Config } from 'tailwindcss';
import { colors, spacing, fontSizes, breakpoints } from './design-system/tokens';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        neutral: colors.neutral,
      },
      spacing: spacing,
      fontSize: fontSizes,
      screens: breakpoints,
    },
  },
  plugins: [],
};

export default config;

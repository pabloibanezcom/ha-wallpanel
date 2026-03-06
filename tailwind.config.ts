import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        card: 'rgba(10, 22, 40, 0.82)',
      },
    },
  },
  plugins: [],
} satisfies Config;

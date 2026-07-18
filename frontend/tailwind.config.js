/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'md': '768px',
      }
    },
  },
  safelist: [
    'hidden',
    'md:flex',
    'md:hidden',
    'max-md:hidden',
    'flex-wrap',
  ],
  plugins: [],
}

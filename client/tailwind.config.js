/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#f5deb3',
          line: '#c28a3a',
        },
      },
      boxShadow: {
        board: '0 20px 40px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
};


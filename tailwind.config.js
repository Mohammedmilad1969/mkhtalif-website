/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#000000',
        gold: '#E8B95B',
        lightGray: '#D3D3D3',
        // Keep purple/pink for backward compatibility but use gold as primary
        purple: '#E8B95B',
        pink: '#D3D3D3',
      },
      fontFamily: {
        arabic: ['"Hacen Algeria"', 'Tajawal', 'sans-serif'],
        english: ['"Hacen Algeria"', 'Poppins', 'sans-serif'],
        title: ['"Ubuntu"', '"Ubuntu Arabic"', 'sans-serif'],
        body: ['"Hacen Algeria"', 'Tajawal', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


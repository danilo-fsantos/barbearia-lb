/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          50: '#f9f8f6',  // Creme muito claro (fundo suave)
          100: '#f0e3d2', // Creme clássico
          200: '#d9c6a7', // Bege envelhecido
          800: '#2a2a2a', // Carvão (fundo principal)
          900: '#1a1a1a', // Preto quase total
          gold: '#c5a059', // O Dourado da marca
          goldHover: '#b08d48', // Dourado mais escuro (interação)
        }
      },
      fontFamily: {
        sans: ['"Lato"', 'sans-serif'], // Fonte limpa para leitura
        serif: ['"Playfair Display"', 'serif'], // Fonte elegante para títulos
      }
    },
  },
  plugins: [],
}
const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Enables dark mode support
  theme: {
    extend: {
      colors: {
        // Expanded brand color palette 
        // Usage: bg-brand-500, text-brand-700 etc.
        brand: {
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: "#f97316", // original brand-color
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          layout: {},
          colors: {
            "base-100": "#FFFFFF",    
            "base-200": "#F5F5F5",
            "base-300": "#E5E5E5",    
            "base-content": "#1F2937",
          }
        },
        dark: {
          layout: {},
          colors: {
            "base-100": "#0A0A0A", // nearly black
            "base-200": "#1A1A1A",
            "base-300": "#2A2A2A",
            "base-content": "#EAEAEA", // off-white
          }
        },
        // Add custom themes here
      }
    })
  ]
};

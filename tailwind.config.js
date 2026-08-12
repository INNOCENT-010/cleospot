/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "var(--brand-red, #E30613)",
          dark: "var(--brand-dark, #B00410)",
          white: "#FFFFFF",
          gold: "#F5B800"
        }
      },
      fontFamily: {
        script: ["'Dancing Script'", "cursive"]
      }
    }
  },
  plugins: []
};

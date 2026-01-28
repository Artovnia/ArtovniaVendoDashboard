const path = require("path")

// get the path of the dependency "@medusajs/ui"
const medusaUI = path.join(
  path.dirname(require.resolve("@medusajs/ui")),
  "**/*.{js,jsx,ts,tsx}"
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", medusaUI],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        'instrument-serif': ['Instrument Serif', 'serif'],
      },
      colors: {
        // Customize your dark theme colors here
        // These will override the default Medusa UI colors
        "ui-bg-base": {
          // Light mode background
          DEFAULT: "var(--ui-bg-base)",
          // Dark mode background - change this to your preferred dark color
          dark: "#0066ff", // Example: darker graphite color
        },
        "ui-bg-subtle": {
          DEFAULT: "var(--ui-bg-subtle)",
          dark: "#0066ff", // Example: slightly lighter graphite for subtle backgrounds
        },
        // You can add more color customizations here
      },
    },
  },
  plugins: [],
}

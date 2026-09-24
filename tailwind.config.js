/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "Outfit", "Inter", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "var(--font-outfit)", "system-ui", "-apple-system", "sans-serif"]
      },
      colors: {
        brand: "#21b5ba",
        "brand-ink": "#157a7d",
      }
    }
  },
  plugins: []
};
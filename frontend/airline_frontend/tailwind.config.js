/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // AirAsia inspired red theme
        "airline-red": "#FF0000",
        "airline-dark": "#222222",
        "airline-light": "#",
        "airline-accent": "#FFD700", // Gold accent
      },
    },
  },
  plugins: [],
};

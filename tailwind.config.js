const withMT = require("@material-tailwind/react/utils/withMT");
/** @type {import('tailwindcss').Config} */
module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    colors: {
      sub_dark: "#1d2635",
      main_dark: "#161d29",
      semisub_dark: "#242f41",
      primary_color: "#2f80ec",
      primary_color_hover: "#1d4ed8",
      main_light: "#eeeeee",
      white: "#ffffff",
      black: "#000000",
      red: "#ff0000",
    },
    extend: {},
  },
  plugins: [require("tailwind-scrollbar")],
});

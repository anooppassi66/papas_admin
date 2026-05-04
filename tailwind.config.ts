import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#f69a39",
          "orange-dark": "#e8880d",
          black: "#1e1e21",
          dark: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};

export default config;

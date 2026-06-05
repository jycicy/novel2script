import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Courier New", "Courier", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF"
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F2937"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem"
      },
      fontSize: {
        xs: ["14px", "20px"],
        sm: ["16px", "24px"],
        base: ["18px", "28px"],
        lg: ["20px", "30px"],
        xl: ["24px", "34px"],
        "2xl": ["32px", "42px"],
        "3xl": ["36px", "46px"],
        "4xl": ["48px", "58px"],
        "5xl": ["60px", "70px"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px"
      }
    }
  },
  plugins: []
};

export default config;


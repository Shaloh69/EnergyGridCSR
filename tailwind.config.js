import { heroui } from "@heroui/theme";
import { gridwiseTailwindConfig } from "./config/gridwise-theme.ts";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ...gridwiseTailwindConfig.colors,
      },
      backgroundImage: {
        ...gridwiseTailwindConfig.backgroundImage,
      },
      boxShadow: {
        ...gridwiseTailwindConfig.boxShadow,
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "energy-pulse": "energy-pulse 2s infinite",
        "data-flow": "data-flow 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "energy-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(0, 200, 150, 0.7)",
          },
          "50%": {
            transform: "scale(1.05)",
            boxShadow: "0 0 0 10px rgba(0, 200, 150, 0)",
          },
        },
        "data-flow": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      spacing: {
        sidebar: "280px",
        header: "72px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            primary: {
              50: "#e6f9f4",
              100: "#ccf3e8",
              200: "#99e7d1",
              300: "#66dbba",
              400: "#33cfa3",
              500: "#00c896", // Electric Emerald
              600: "#00a078",
              700: "#00785a",
              800: "#00503c",
              900: "#00281e",
              DEFAULT: "#00c896",
            },
            secondary: {
              50: "#e6fcfa",
              100: "#ccf9f5",
              200: "#99f3eb",
              300: "#66ede1",
              400: "#33e7d7",
              500: "#3cd3c2", // Glacial Teal
              600: "#2da69b",
              700: "#1e7974",
              800: "#0f4c4d",
              900: "#002626",
              DEFAULT: "#3cd3c2",
            },
            background: "#0A1F44", // Midnight Blue
            foreground: "#F5F7FA", // Solar White
            content1: "#1A2A54",
            content2: "#2E2F3E", // Cool Graphite
            content3: "#3A3B4F",
            content4: "#464762",
          },
        },
        light: {
          colors: {
            primary: {
              50: "#e6f9f4",
              100: "#ccf3e8",
              200: "#99e7d1",
              300: "#66dbba",
              400: "#33cfa3",
              500: "#00c896", // Electric Emerald
              600: "#00a078",
              700: "#00785a",
              800: "#00503c",
              900: "#00281e",
              DEFAULT: "#00c896",
            },
            secondary: {
              50: "#e6fcfa",
              100: "#ccf9f5",
              200: "#99f3eb",
              300: "#66ede1",
              400: "#33e7d7",
              500: "#3cd3c2", // Glacial Teal
              600: "#2da69b",
              700: "#1e7974",
              800: "#0f4c4d",
              900: "#002626",
              DEFAULT: "#3cd3c2",
            },
            background: "#F5F7FA", // Solar White
            foreground: "#2E2F3E", // Cool Graphite
            content1: "#FFFFFF",
            content2: "#F8F9FA",
            content3: "#E9ECEF",
            content4: "#DEE2E6",
          },
        },
      },
    }),
  ],
};

module.exports = config;

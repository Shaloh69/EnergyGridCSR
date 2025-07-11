// config/gridwise-theme.ts

export const gridwiseTailwindConfig = {
  colors: {
    // GridWise Energy Management Color Palette
    "electric-emerald": {
      50: "#e6f9f4",
      100: "#ccf3e8",
      200: "#99e7d1",
      300: "#66dbba",
      400: "#33cfa3",
      500: "#00c896", // Primary Electric Emerald
      600: "#00a078",
      700: "#00785a",
      800: "#00503c",
      900: "#00281e",
      DEFAULT: "#00c896",
    },
    "glacial-teal": {
      50: "#e6fcfa",
      100: "#ccf9f5",
      200: "#99f3eb",
      300: "#66ede1",
      400: "#33e7d7",
      500: "#3cd3c2", // Secondary Glacial Teal
      600: "#2da69b",
      700: "#1e7974",
      800: "#0f4c4d",
      900: "#002626",
      DEFAULT: "#3cd3c2",
    },
    "midnight-blue": {
      50: "#e8eef7",
      100: "#d1ddee",
      200: "#a3bbdd",
      300: "#7599cc",
      400: "#4777bb",
      500: "#0A1F44", // Background Midnight Blue
      600: "#081932",
      700: "#061325",
      800: "#040d19",
      900: "#02060c",
      DEFAULT: "#0A1F44",
    },
    "cool-graphite": {
      50: "#f8f8f9",
      100: "#f1f1f3",
      200: "#e3e3e7",
      300: "#d5d5db",
      400: "#c7c7cf",
      500: "#2E2F3E", // Text/Border Cool Graphite
      600: "#252632",
      700: "#1c1d25",
      800: "#131419",
      900: "#0a0a0c",
      DEFAULT: "#2E2F3E",
    },
    "solar-white": {
      50: "#ffffff",
      100: "#fefefe",
      200: "#fdfdfd",
      300: "#fcfcfc",
      400: "#fbfbfb",
      500: "#F5F7FA", // Clean contrast Solar White
      600: "#c4c5c8",
      700: "#939496",
      800: "#626264",
      900: "#313132",
      DEFAULT: "#F5F7FA",
    },
    "neon-lime": {
      50: "#fbffe6",
      100: "#f7ffcc",
      200: "#efff99",
      300: "#e7ff66",
      400: "#dfff33",
      500: "#B6FF00", // Alert/Energy Neon Lime
      600: "#92cc00",
      700: "#6e9900",
      800: "#4a6600",
      900: "#263300",
      DEFAULT: "#B6FF00",
    },
  },
  backgroundImage: {
    "gradient-energy": "linear-gradient(135deg, #00c896 0%, #3cd3c2 100%)",
    "gradient-midnight": "linear-gradient(135deg, #0A1F44 0%, #2E2F3E 100%)",
    "gradient-mesh": `
        radial-gradient(at 40% 20%, #00c896 0px, transparent 50%),
        radial-gradient(at 80% 0%, #3cd3c2 0px, transparent 50%),
        radial-gradient(at 0% 50%, #0A1F44 0px, transparent 50%),
        radial-gradient(at 80% 50%, #2E2F3E 0px, transparent 50%),
        radial-gradient(at 0% 100%, #B6FF00 0px, transparent 50%),
        radial-gradient(at 80% 100%, #F5F7FA 0px, transparent 50%),
        radial-gradient(at 0% 0%, #00c896 0px, transparent 50%)
      `,
    "energy-glow":
      "radial-gradient(circle at center, rgba(0, 200, 150, 0.1) 0%, transparent 70%)",
    "data-viz":
      "linear-gradient(180deg, rgba(0, 200, 150, 0.05) 0%, rgba(60, 211, 194, 0.05) 100%)",
  },
  boxShadow: {
    energy: "0 4px 14px 0 rgba(0, 200, 150, 0.15)",
    teal: "0 4px 14px 0 rgba(60, 211, 194, 0.15)",
    midnight: "0 4px 14px 0 rgba(10, 31, 68, 0.25)",
    neon: "0 0 20px rgba(182, 255, 0, 0.3), 0 0 40px rgba(182, 255, 0, 0.1)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    dashboard:
      "0 2px 8px 0 rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.06)",
  },
};

// HeroUI Theme Extension for GridWise
export const gridwiseHeroUITheme = {
  colors: {
    primary: {
      50: "#e6f9f4",
      100: "#ccf3e8",
      200: "#99e7d1",
      300: "#66dbba",
      400: "#33cfa3",
      500: "#00c896",
      600: "#00a078",
      700: "#00785a",
      800: "#00503c",
      900: "#00281e",
      DEFAULT: "#00c896",
      foreground: "#ffffff",
    },
    secondary: {
      50: "#e6fcfa",
      100: "#ccf9f5",
      200: "#99f3eb",
      300: "#66ede1",
      400: "#33e7d7",
      500: "#3cd3c2",
      600: "#2da69b",
      700: "#1e7974",
      800: "#0f4c4d",
      900: "#002626",
      DEFAULT: "#3cd3c2",
      foreground: "#ffffff",
    },
    success: {
      50: "#e6f9f4",
      100: "#ccf3e8",
      200: "#99e7d1",
      300: "#66dbba",
      400: "#33cfa3",
      500: "#00c896",
      600: "#00a078",
      700: "#00785a",
      800: "#00503c",
      900: "#00281e",
      DEFAULT: "#00c896",
      foreground: "#ffffff",
    },
    warning: {
      50: "#fff8e1",
      100: "#ffecb3",
      200: "#ffe082",
      300: "#ffd54f",
      400: "#ffca28",
      500: "#ffc107",
      600: "#ffb300",
      700: "#ffa000",
      800: "#ff8f00",
      900: "#ff6f00",
      DEFAULT: "#ffc107",
      foreground: "#000000",
    },
    danger: {
      50: "#ffebee",
      100: "#ffcdd2",
      200: "#ef9a9a",
      300: "#e57373",
      400: "#ef5350",
      500: "#f44336",
      600: "#e53935",
      700: "#d32f2f",
      800: "#c62828",
      900: "#b71c1c",
      DEFAULT: "#f44336",
      foreground: "#ffffff",
    },
  },
};

// Energy Visualization Colors
export const energyColors = {
  consumption: "#00c896",
  generation: "#3cd3c2",
  storage: "#B6FF00",
  waste: "#f44336",
  efficiency: "#ffc107",
  demand: "#9c27b0",
  supply: "#2196f3",
  renewable: "#4caf50",
  fossil: "#ff5722",
  grid: "#607d8b",
};

// Chart Color Palettes
export const chartColors = {
  primary: ["#00c896", "#3cd3c2", "#B6FF00", "#ffc107", "#f44336"],
  energy: ["#00c896", "#33cfa3", "#66dbba", "#99e7d1", "#ccf3e8"],
  compliance: ["#00c896", "#ffc107", "#f44336", "#9e9e9e"],
  performance: ["#00c896", "#3cd3c2", "#B6FF00"],
  alerts: ["#f44336", "#ffc107", "#00c896", "#9e9e9e"],
};

// Dashboard Specific Styling
export const dashboardStyles = {
  sidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #0A1F44 0%, #2E2F3E 100%)",
  },
  header: {
    height: "72px",
    background: "rgba(245, 247, 250, 0.95)",
    backdropFilter: "blur(20px)",
  },
  card: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  dataViz: {
    background:
      "linear-gradient(180deg, rgba(0, 200, 150, 0.05) 0%, rgba(60, 211, 194, 0.05) 100%)",
  },
};

// Animation Presets
export const animations = {
  fadeIn: "fade-in 0.3s ease-out",
  slideIn: "slide-in 0.3s ease-out",
  slideUp: "slide-up 0.3s ease-out",
  scaleIn: "scale-in 0.2s ease-out",
  energyPulse: "energy-pulse 2s infinite",
  dataFlow: "data-flow 3s linear infinite",
};

export default gridwiseTailwindConfig;

/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        navy: {
          50: "#EAF1FB",
          100: "#CFDFF5",
          200: "#9FBFEB",
          300: "#6F9FE1",
          400: "#3F7FD7",
          500: "#0B5FC9",
          600: "#0B3D91",
          700: "#082D6E",
          800: "#061E4B",
          900: "#030F28",
        },
        teal: {
          400: "#26E3BA",
          500: "#00D4AA",
          600: "#00AE8B",
          700: "#00886C",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: [
          '"Source Han Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
        display: ['Montserrat', '"Source Han Sans SC"', "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(11, 61, 145, 0.12)",
        cardHover: "0 12px 40px -10px rgba(11, 61, 145, 0.25)",
        glow: "0 0 32px rgba(0, 212, 170, 0.35)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        popIn: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        popIn: "popIn 0.4s ease-out both",
        shimmer: "shimmer 3s linear infinite",
      },
      backgroundImage: {
        "grid-navy":
          "linear-gradient(rgba(11,61,145,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,61,145,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
    },
  },
  plugins: [],
};

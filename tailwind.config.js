/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // --- Orree signature palette — keep the 60:30:10 ratio wherever used ---
        green: {
          DEFAULT: "#15362A", // Deepest Green — 60% — base / canvas
          deep: "#15362A",
          deeper: "#0D241B", // darker shade of the same hue, for depth/shadow only
          soft: "#20493A", // lighter tint of the same hue, for glass panels/cards
          mist: "#2A5644",
        },
        cream: {
          DEFAULT: "#E8D6AC", // Deep Cream — 30% — text / space / canvas
          dim: "#C7B384", // muted tint for secondary text
          bright: "#F5EDD9", // lighter tint for hover/highlight surfaces
        },
        amber: {
          DEFAULT: "#E0661F", // Vibrant Amber — 10% — accent / spark only
          soft: "#EE8A4E",
          deep: "#B84F16",
        },
      },
      fontFamily: {
        // Display: premium, warm, editorial weight — headlines & CTAs
        display: ["'Anek Bangla'", "'Hind Siliguri'", "sans-serif"],
        // Body: calm, highly legible Bengali sans
        body: ["'Hind Siliguri'", "'Anek Bangla'", "sans-serif"],
        // Quote/nostalgia accent: warm serif for pull-quotes only
        quote: ["'Noto Serif Bengali'", "serif"],
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(13, 36, 27, 0.35)",
        "amber-glow": "0 0 40px 0 rgba(224, 102, 31, 0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(3deg)" },
        },
        "drift": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(12px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "drift": "drift 9s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

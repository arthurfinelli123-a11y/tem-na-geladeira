/** @type {import('tailwindcss').Config} */
// Tokens usados pelo código existente: brand(-soft/-light/-dark/50-900), accent(-dark/-soft), cream, ink, muted,
// leaf, rounded-card, shadow-soft/lift, font-display.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F4E3D", // verde-escuro (primária)
          dark: "#173B2E",
          light: "#A8D5BA", // verde-claro (secundária)
          soft: "#E6F2EA",
          50: "#F1F7F3",
          100: "#DCEBE2",
          200: "#A8D5BA",
          300: "#86C09C",
          400: "#4F8F6F",
          500: "#2F6A52",
          600: "#285C46",
          700: "#1F4E3D",
          800: "#173B2E",
          900: "#0F271E",
        },
        leaf: "#A8D5BA",
        cream: "#FAF6EF", // fundo
        accent: { DEFAULT: "#F59E5B", dark: "#C9661A", soft: "#FDE6D2" }, // laranja suave (CTA)
        danger: "#B3261E", // erros, exclusões e alertas de alergia
        ink: "#16261F",
        muted: "#586B62",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.25rem" },
      boxShadow: {
        soft: "0 6px 24px -10px rgba(31, 78, 61, 0.22)",
        lift: "0 14px 40px -14px rgba(31, 78, 61, 0.32)",
      },
    },
  },
  plugins: [],
};

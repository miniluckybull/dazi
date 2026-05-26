/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glass:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 24px -12px rgba(79,70,229,0.18)",
        "glass-lg":
          "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 48px -20px rgba(79,70,229,0.25)",
      },
    },
  },
  plugins: [],
};

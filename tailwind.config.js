/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // 设计令牌：与 daemon static/index.html 的 :root CSS 变量保持同步。
        // 颜色走 CSS 变量重映射，[data-theme="dark"] 下整体换值（见 App.css）。
        white: "rgb(var(--c-surface) / <alpha-value>)",
        gray: {
          50: "rgb(var(--c-gray-50) / <alpha-value>)",
          100: "rgb(var(--c-gray-100) / <alpha-value>)",
          200: "rgb(var(--c-gray-200) / <alpha-value>)",
          300: "rgb(var(--c-gray-300) / <alpha-value>)",
          400: "rgb(var(--c-gray-400) / <alpha-value>)",
          500: "rgb(var(--c-gray-500) / <alpha-value>)",
          600: "rgb(var(--c-gray-600) / <alpha-value>)",
          700: "rgb(var(--c-gray-700) / <alpha-value>)",
          800: "rgb(var(--c-gray-800) / <alpha-value>)",
          900: "rgb(var(--c-gray-900) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          hover: "rgb(var(--c-accent-hover) / <alpha-value>)",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          border: "rgb(var(--c-accent-border) / <alpha-value>)",
          text: "rgb(var(--c-accent-text) / <alpha-value>)",
        },
        // 彩色按钮上的文字：两个主题下都保持纯白
        "on-accent": "#ffffff",
      },
      // border-white/* 单独走 --c-border：分隔线与背景拉开对比度，
      // 不影响 bg-white / text-* 的 --c-surface 映射
      borderColor: {
        white: "rgb(var(--c-border) / <alpha-value>)",
      },
      ringColor: {
        white: "rgb(var(--c-border) / <alpha-value>)",
      },
      boxShadow: {
        glass: "var(--shadow-glass)",
        "glass-lg": "var(--shadow-glass-lg)",
      },
    },
  },
  plugins: [],
};

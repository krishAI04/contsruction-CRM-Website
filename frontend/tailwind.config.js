/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f6f8fb",
        pine: "#2563eb",
        steel: "#64748b",
        amber: "#f59e0b",
        line: "#e5e7eb"
      },
      boxShadow: {
        soft: "0 14px 34px rgba(15, 23, 42, 0.07)"
      }
    },
  },
  plugins: [],
};

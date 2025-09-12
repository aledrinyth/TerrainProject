/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'desk-fill': '#EDEDED',
        'monitor-fill': '#E2E2E2',
        'seat-green-fill': '#A9FFA3',
        'seat-green-border': '#408800',
        // You can add the red seat colors here later
        // 'seat-red-fill': '#...',
        // 'seat-red-border': '#...',
      },
      borderRadius: {
        '26px': '26px',
        '17px': '17px',
      },
      fontFamily: {
        'americana-mono': ['GT-Americana-Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

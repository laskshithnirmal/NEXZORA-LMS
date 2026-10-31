/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        // NEXZORA identity: black, white and neutral greys, plus ONE accent colour.
        // The accent is reserved for links, focus rings and the current-page marker.
        accent: {
          50: '#eef3ff',
          100: '#dce6fd',
          200: '#bccdfa',
          300: '#8eaaf4',
          400: '#5c80ea',
          500: '#3a5fdc',
          600: '#2445c4',
          700: '#1d379f',
          800: '#1c3181',
          900: '#1b2c67',
          950: '#121b3f',
        },
      },
    },
  },
  plugins: [],
}

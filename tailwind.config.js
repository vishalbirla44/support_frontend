/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'whatsapp': '#25D366',
        'whatsapp-dark': '#20ba58',
        'sidebar': '#1a1a2e',
        'sidebar-light': '#16213e',
        'chat-gray': '#f0f0f0',
        'chat-in': '#e8e8e8',
        'chat-out': '#25D366',
        'status-online': '#31a24c',
        'status-away': '#ffa500',
        'status-offline': '#909090'
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite'
      }
    }
  },
  plugins: []
}
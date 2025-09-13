/** @type {import('tailwindcss').Config} */

module.exports = {

 content: [

 "./index.html",
 "./src/**/*.{js,ts,jsx,tsx}",

 "!./node_modules/**"

 ],

 darkMode: 'class',

 theme: {

 extend: {
 animation: {

 'fade-in': 'fadeIn 0.6s ease-out',

 },

 keyframes: {

 fadeIn: {

 '0%': { opacity: 0, transform: 'translateY(20px)' },

 '100%': { opacity: 1, transform: 'translateY(0)' },

 },

 },

 colors: {

 primary: {

 DEFAULT: '#6366F1', // Indigo-500

 dark: '#4F46E5',    // Indigo-600

 },

 accent: {

 DEFAULT: '#3B82F6', // Blue-500

 },

 },

 fontFamily: {

 sans: ['Inter', 'ui-sans-serif', 'system-ui'],

 },

 },

 },

 plugins: [

 require('@tailwindcss/forms'),

 require('@tailwindcss/typography'),

 ],

};
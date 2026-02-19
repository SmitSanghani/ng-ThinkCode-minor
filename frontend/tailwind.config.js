/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#6366F1', // Primary Purple
                    hover: '#4F46E5',   // Primary Hover
                },
                sidebar: {
                    from: '#0F172A',
                    to: '#1E293B'
                },
                background: '#F8FAFC', // Very light gray
                card: '#FFFFFF',
                text: {
                    primary: '#111827',
                    secondary: '#6B7280'
                },
                success: {
                    bg: '#DCFCE7',
                    text: '#15803D'
                },
                warning: {
                    bg: '#FEF3C7',
                    text: '#B45309'
                },
                danger: {
                    bg: '#FEE2E2',
                    text: '#B91C1C'
                }
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0,0,0,0.04)',
                'button': '0 4px 12px rgba(99,102,241,0.2)',
            }
        },
    },
    plugins: [],
}

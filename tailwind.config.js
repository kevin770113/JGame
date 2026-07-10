/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blood-red': '#880808',
      },
      fontSize: {
        '3xs': '0.5rem',
        '2xs': '0.65rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        // ★ 角鬥場 2.0 核心動效：註冊極速左右劇烈震動與全屏紅光閃擊
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'flash': 'flash 0.3s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // ★ 金融重擊感震動軌跡：透過短促的 X 軸非線性位移模擬強烈碰撞
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(3px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-5px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(5px, 0, 0)' },
        },
        // ★ 滿版血色閃擊軌跡：極速淡入並維持高飽和度
        flash: {
          '0%': { opacity: '0' },
          '25%': { opacity: '0.85' },
          '50%': { opacity: '0.3' },
          '75%': { opacity: '0.9' },
          '100%': { opacity: '0' },
        }
      },
    },
  },
  plugins: [],
}

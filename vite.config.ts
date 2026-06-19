import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 輸出目錄，Cloudflare Pages 預設會抓取 dist 資料夾
    outDir: 'dist',
    // 確保編譯後的資源路徑正確
    base: './', 
  }
})

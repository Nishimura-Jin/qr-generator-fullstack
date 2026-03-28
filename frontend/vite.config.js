import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api' で始まるリクエストを Pythonサーバー（8000番）に転送する設定
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
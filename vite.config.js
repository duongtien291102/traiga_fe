import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certPath = path.resolve(__dirname, '../BE/server.crt')
const keyPath = path.resolve(__dirname, '../BE/server.key')
const hasHttps = fs.existsSync(certPath) && fs.existsSync(keyPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 3000,
    open: false,
    allowedHosts: true,
    ...(hasHttps
      ? {
          https: {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: 'https://demo-webtraiga.proudsky-59d95604.southeastasia.azurecontainerapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'wss://demo-webtraiga.proudsky-59d95604.southeastasia.azurecontainerapps.io',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/live': {
        target: 'http://103.82.26.60:8080',
        changeOrigin: true,
      },
      '/abr': {
        target: 'http://103.82.26.60:8080',
        changeOrigin: true,
      },
      '/rtc': {
        target: 'http://103.82.26.60:8080',
        changeOrigin: true,
      },
      '/srs-api': {
        target: 'http://103.82.26.60:8080',
        rewrite: (path) => path.replace(/^\/srs-api/, '/api'),
        changeOrigin: true,
      },
      '/record': {
        target: 'http://103.82.26.60:8080',
        changeOrigin: true,
      },
    },
  },
})

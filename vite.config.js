import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/v1': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://socket:3000',
        ws: true,
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://backend:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            // підкидаємо правильні заголовки для HLS-стріму
            if (req.url?.endsWith('.m3u8')) {
              proxyRes.headers['Content-Type'] = 'application/vnd.apple.mpegurl';
            } else if (req.url?.endsWith('.ts')) {
              proxyRes.headers['Content-Type'] = 'video/MP2T';
            }
          });
        }
      }
    }
  }
})
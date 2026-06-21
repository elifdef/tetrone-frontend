import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            // підкидаємо правильні заголовки для HLS-стріму
            if (req.url.endsWith('.m3u8')) {
              proxyRes.headers['Content-Type'] = 'application/vnd.apple.mpegurl';
            } else if (req.url.endsWith('.ts')) {
              proxyRes.headers['Content-Type'] = 'video/MP2T';
            }
          });
        }
      }
    }
  }
})
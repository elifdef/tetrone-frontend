
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';

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

            '/storage': {
                target: 'http://backend:8000',
                changeOrigin: true,
            },

            '/socket.io': {
                target: 'http://socket:3000',
                ws: true,
                changeOrigin: true,
            },
        },
    },
});

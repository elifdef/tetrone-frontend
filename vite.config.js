
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        react(),
        svgr(),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@ui': path.resolve(__dirname, './src/components/ui'),
            '@components': path.resolve(__dirname, './src/components'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@context': path.resolve(__dirname, './src/context'),
            '@services': path.resolve(__dirname, './src/services'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@common': path.resolve(__dirname, './src/components/common'),
        },
    },

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

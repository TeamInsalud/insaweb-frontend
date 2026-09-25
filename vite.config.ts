import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo, /api va al backend local (o al indicado en API_PROXY)
    proxy: { '/api': process.env.API_PROXY || 'http://localhost:3001' },
  },
});

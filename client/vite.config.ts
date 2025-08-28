import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa', 
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

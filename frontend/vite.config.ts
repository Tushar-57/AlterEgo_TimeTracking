import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const timetrackerApiTarget = process.env.VITE_TIMETRACKER_API_ORIGIN || 'http://localhost:8080';
const agenticApiTarget = process.env.VITE_AGENTIC_API_ORIGIN || 'http://localhost:8000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: timetrackerApiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/agentic-api': {
        target: agenticApiTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/agentic-api/, ''),
      },
    },
  },
});
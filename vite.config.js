import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Splitting heavy libraries into separate background chunks
          recharts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
          vendor: ['react', 'react-dom', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increased limit to avoid false warnings
  }
});
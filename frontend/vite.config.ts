import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Cambia al puerto 5173 para evitar conflicto con el Gateway (3000)
    port: 5173,
    host: true,
  },
});

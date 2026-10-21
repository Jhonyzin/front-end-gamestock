import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração do Vite: React + servidor de desenvolvimento na porta 3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});

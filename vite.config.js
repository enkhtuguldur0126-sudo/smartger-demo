import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' нь GitHub Pages-ийн дэд хавтсанд ч ажиллуулна.
export default defineConfig({
  plugins: [react()],
  base: './'
});

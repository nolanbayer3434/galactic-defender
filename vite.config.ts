import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures paths are relative for static hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});

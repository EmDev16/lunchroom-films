import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paden, zodat CSS/JS werken onder /lunchroom-films/
  base: './',
  // Zet de build-output meteen in je docs-folder
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
});

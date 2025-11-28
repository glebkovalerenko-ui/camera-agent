import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    host: true
  },
  // --- ИЗМЕНЕНИЕ: Оптимизация для продакшна ---
  esbuild: {
    // Автоматически удаляет console.log и debugger при билде.
    // Это решает проблему "убийства производительности" логами в цикле update.
    drop: ['console', 'debugger']
  },
  // ---------------------------------------------
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, 
    copyPublicDir: true,
    emptyOutDir: false, 
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.includes('sprites/') || 
              assetInfo.name.includes('backgrounds/') ||
              assetInfo.name.includes('audio/')) {
            return assetInfo.name; 
          }
          if (assetInfo.name.includes('/config/')) {
            return assetInfo.name.replace('config/', 'config/');
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    }
  },
  publicDir: 'public',
  plugins: [{
    name: 'copy-config',
    closeBundle: async () => {
      await fs.ensureDir('dist/config');
      await fs.copy(
        'config/crt-effect.json',
        'dist/config/crt-effect.json'
      );
      console.log('CRT config copied to dist/config');
    }
  }]
});
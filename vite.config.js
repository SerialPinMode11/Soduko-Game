import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'SodukoNelson',
      fileName: (format) => (format === 'es' ? 'soduko-nelson.js' : 'soduko-nelson.umd.js'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'soduko-nelson.[ext]',
      },
    },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});

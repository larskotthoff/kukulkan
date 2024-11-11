import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    solidPlugin(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  server: {
    port: 3000,
    proxy: {
      // Proxy everything except assets to Flask
      '^(?!/src|/node_modules|/@vite|/@id|/@fs|/@solid).*': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      treeshake: true
    }
  },
});

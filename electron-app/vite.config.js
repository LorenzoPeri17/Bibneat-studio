import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'wasm/*',
          dest: 'wasm'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@wasm': path.resolve(__dirname, 'wasm'),
    },
  },
  base: './', // Set base to relative path for proper asset loading
  build: {
    outDir: '.vite/renderer/main_window',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
    // Make sure to generate separate chunks for main process and renderer
    chunkSizeWarningLimit: 600,
  },
  // Copy WASM files to the output directory
  publicDir: 'public',
})

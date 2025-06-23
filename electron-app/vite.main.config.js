import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some Node.js globals and modules are not available in the browser
    // Tell Vite to polyfill them or handle them properly
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    ssr: true,
    emptyOutDir: false, // Don't clean the output directory
    lib: {
      entry: 'main.js',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: [
        'electron',
        'path',
        'fs',
        'url',
        'https',
        'http',
        ...Object.keys(require('./package.json').dependencies || {}),
      ],
    },
    outDir: '.vite/build',
  },
});

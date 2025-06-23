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
      entry: 'preload.cjs',  // Correct source file name
      formats: ['cjs'],
      fileName: () => 'preload.js',  // Output as .js for consistency
    },
    rollupOptions: {
      external: [
        'electron',
        ...Object.keys(require('./package.json').dependencies || {}),
      ],
    },
    outDir: '.vite/build',
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  esbuild: {
    // Remove console.log and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        // Let Rollup automatically handle chunking to avoid circular dependencies
        // Only specify file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings
    // Enable minification (Vite uses esbuild by default, faster than terser)
    minify: 'esbuild', // esbuild is faster and included with Vite
    // Optimize chunk size
    target: 'es2015',
    cssCodeSplit: true,
    // Reduce asset inline limit to force separate files
    assetsInlineLimit: 4096, // 4KB - smaller images will be inlined
    // CommonJS options to handle circular dependencies better
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})

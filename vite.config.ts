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
        // Simplified chunking to avoid circular dependencies
        manualChunks: (id) => {
          // Only split node_modules, let Rollup handle the rest automatically
          if (id.includes('node_modules')) {
            // React core - must be separate
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Large libraries that should be separate
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('@tanstack/react-table')) {
              return 'react-table';
            }
            // Everything else in node_modules goes to vendor
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
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

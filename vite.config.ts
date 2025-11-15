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
        manualChunks: (id) => {
          // More aggressive code splitting
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Admin heavy libraries
            if (id.includes('@tanstack/react-table') || id.includes('@dnd-kit')) {
              return 'admin-vendor';
            }
            // Other vendor libraries
            if (id.includes('axios') || id.includes('socket.io')) {
              return 'network-vendor';
            }
            // Everything else in node_modules
            return 'vendor';
          }
          // Split admin pages into separate chunk
          if (id.includes('/admin/')) {
            return 'admin-pages';
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
  },
})

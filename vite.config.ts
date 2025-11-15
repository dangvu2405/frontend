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
        manualChunks: {
          // Vendor chunks - use object format to avoid circular dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          'chart-vendor': ['recharts'],
          'admin-vendor': ['@tanstack/react-table', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/modifiers', '@dnd-kit/utilities'],
          'network-vendor': ['axios', 'socket.io-client'],
          'utils-vendor': ['date-fns', 'zod', 'clsx', 'tailwind-merge', 'class-variance-authority'],
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

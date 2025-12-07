import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Disable caching in development
    hmr: {
      overlay: false,
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Force cache busting in development
  build: {
    rollupOptions: {
      output: {
        entryFileNames: mode === 'development' ? '[name].js' : 'assets/[name]-[hash].js',
        chunkFileNames: mode === 'development' ? '[name].js' : 'assets/[name]-[hash].js',
        assetFileNames: mode === 'development' ? '[name].[ext]' : 'assets/[name]-[hash].[ext]'
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

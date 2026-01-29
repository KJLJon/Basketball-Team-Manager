import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin to inject build time into service worker
function injectSwBuildTime() {
  return {
    name: 'inject-sw-build-time',
    writeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        const buildTime = new Date().toISOString();
        // Replace version and add build time comment
        content = content.replace(
          "const CACHE_VERSION = 'v1.0.0';",
          `const CACHE_VERSION = '${buildTime}';`
        );
        fs.writeFileSync(swPath, content);
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectSwBuildTime()],
  base: '/Basketball-Team-Manager/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A new id every time the site is built. The built site carries it inside the code
// (__BUILD_ID__) and also publishes it in version.json, so open pages can tell
// when a newer version has been uploaded.
const buildId = String(Date.now())

function versionFile() {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
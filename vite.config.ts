import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import htmlMinify from './plugins/vite-plugin-html-minify';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), htmlMinify()],
})

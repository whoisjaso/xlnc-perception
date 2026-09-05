import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

// Single-file build for hosted previews (everything inlined, hash routing).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  define: { 'import.meta.env.VITE_ROUTER': JSON.stringify('hash') },
  build: { target: 'es2022', outDir: 'dist-artifact', emptyOutDir: true, cssCodeSplit: false, assetsInlineLimit: 100000000 },
});

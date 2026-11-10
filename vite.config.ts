import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This repository is published at https://<owner>.github.io/-/
export default defineConfig({
  base: '/-/',
  plugins: [react()],
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
    build: {
      target: 'esnext',
      minify: 'esbuild' as const,
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'lisyan-ai': [
              './src/components/lisyan-ai/LisyanAIApp.tsx',
              './src/components/lisyan-ai/lib/chatApi.ts',
            ],
            'optimizer': [
              './src/components/lisyan-ai/lib/optimizer/smartRouter.ts',
              './src/components/lisyan-ai/lib/optimizer/cacheEngine.ts',
              './src/components/lisyan-ai/lib/optimizer/contextManager.ts',
              './src/components/lisyan-ai/lib/optimizer/textCompressor.ts',
            ],
            'firebase': ['./src/lib/firebase.ts'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});

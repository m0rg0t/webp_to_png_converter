import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: [react(), legacy({ targets: ['defaults', 'not IE 11'] })],
  resolve: { alias: command === 'serve' && mode === 'vk-mock' ? [{ find: /^@vkontakte\/vk-bridge$/, replacement: fileURLToPath(new URL('./src/test/vk-bridge-runtime/vkBridgeRuntimeMock.ts', import.meta.url)) }] : [] },
  optimizeDeps: { exclude: command === 'serve' && mode === 'vk-mock' ? ['@vkontakte/vk-bridge'] : [] },
  server: { port: 5173, host: 'localhost' },
  build: { outDir: 'build' },
}));

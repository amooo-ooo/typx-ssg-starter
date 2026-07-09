import { defineConfig } from 'vite';
import { globSync } from 'glob';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { typxRouter } from './scripts/vite-plugin-typx-router';

const execAsync = promisify(exec);
const CACHE_DIR = resolve(process.cwd(), '.typx');

const buildTypstFiles = async (file?: string) => {
  console.log(file ? `[Typx HMR] Detected change in ${file}, rebuilding...` : '[Typx SSG] Building Typst files...');
  await execAsync('bun scripts/ssg.ts');
};

export default defineConfig({
  root: '.typx',
  base: './',
  plugins: [
    typxRouter(),
    {
      name: 'typst-hmr',
      enforce: 'pre',
      configureServer(server) {
        server.watcher.add([
          resolve(process.cwd(), 'src').replace(/\\/g, '/')
        ]);
      },
      async buildStart() {
        await buildTypstFiles();
      },
      async handleHotUpdate({ file, server, modules }) {
        if (file.includes('.typx')) return [];
        if (!file.endsWith('.typ') && !(file.endsWith('.html') && (file.includes('src/layouts') || file.includes('src\\layouts')))) return;
        
        await buildTypstFiles(file);
        server.ws.send({ type: 'custom', event: 'typx:hmr' });
        return [];
      }
    }
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '/src': resolve(process.cwd(), 'src'),
      '/scripts': resolve(process.cwd(), 'scripts'),
    }
  },
  server: {
    watch: {
      ignored: (p) => p.includes('.typx') && !p.includes('node_modules')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        globSync('**/*.html', { cwd: CACHE_DIR, ignore: ['_temp/**'] })
          .map(file => [file.replace(/\.html$/, ''), resolve(CACHE_DIR, file)])
      )
    },
  },
});

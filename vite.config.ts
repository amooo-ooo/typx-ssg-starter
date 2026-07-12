import { defineConfig } from 'vite';
import { globSync } from 'glob';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { typxRouter } from './scripts/vite-plugin-typx-router';

const execAsync = promisify(exec);
const CACHE_DIR = resolve(process.cwd(), '.typx');

const buildTypstFiles = async (file?: string) => {
  const prefix = '\x1b[35mtypx\x1b[0m';
  if (file) {
    console.log(`${prefix} hmr update ${file}`);
  }
  try {
    const { stdout, stderr } = await execAsync('bun scripts/ssg.ts');
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  } catch (e: unknown) {
    const err = e as { stdout?: string | Buffer, stderr?: string | Buffer };
    if (err && err.stdout) console.log(err.stdout.toString().trim());
    if (err && err.stderr) console.error(err.stderr.toString().trim());
  }
};

export default defineConfig({
  root: '.typx',
  base: './',
  publicDir: resolve(process.cwd(), 'public'),
  plugins: [
    typxRouter(),
    {
      name: 'copy-typ-files',
      apply: 'build',
      generateBundle() {
        const typFiles = globSync('**/*.typ', { cwd: resolve(process.cwd(), 'src/pages') });
        for (const file of typFiles) {
          const source = readFileSync(resolve(process.cwd(), 'src/pages', file));
          this.emitFile({
            type: 'asset',
            fileName: file.replace(/\\/g, '/'),
            source,
          });
        }
      }
    },
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

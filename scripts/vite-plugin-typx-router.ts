import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Vite plugin to inject the SPA router client into the HTML body.
 */
export function typxRouter(): Plugin {
  return {
    name: 'typx-router',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url;
        
        if (url) {
          const cleanUrl = url.split('?')[0];
          
          if (cleanUrl && cleanUrl.endsWith('.typ')) {
            const possiblePaths = [
              resolve(process.cwd(), 'src/pages', cleanUrl.slice(1)),
              resolve(process.cwd(), 'src', cleanUrl.slice(1))
            ];
            
            for (const filePath of possiblePaths) {
              if (existsSync(filePath)) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end(readFileSync(filePath));
                return;
              }
            }
          }
        }

        const accept = req.headers.accept || '';
        if (url && !url.includes('.') && !url.endsWith('/') && accept.includes('text/html')) {
          req.url += '.html';
        }
        next();
      });
    }
  };
}

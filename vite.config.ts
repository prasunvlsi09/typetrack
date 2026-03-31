import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serve-zip',
        configureServer(server) {
          server.middlewares.use('/download-zip', (req, res) => {
            const zipPath = path.resolve(__dirname, 'website.zip');
            if (fs.existsSync(zipPath)) {
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="website.zip"');
              fs.createReadStream(zipPath).pipe(res);
            } else {
              res.statusCode = 404;
              res.end('Zip file not found. Please ask the AI to generate it again.');
            }
          });
          server.middlewares.use('/download-cloudflare', (req, res) => {
            const zipPath = path.resolve(__dirname, 'cloudflare.zip');
            if (fs.existsSync(zipPath)) {
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="cloudflare.zip"');
              fs.createReadStream(zipPath).pipe(res);
            } else {
              res.statusCode = 404;
              res.end('Zip file not found. Please ask the AI to generate it again.');
            }
          });
          server.middlewares.use('/download-index', (req, res) => {
            const filePath = path.resolve(__dirname, 'index.html');
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/html');
              res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
              fs.createReadStream(filePath).pipe(res);
            } else {
              res.statusCode = 404;
              res.end('File not found.');
            }
          });
        }
      }
    ],
    define: {
      'process.env.TOPE_API_KEY': JSON.stringify(env.TOPE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

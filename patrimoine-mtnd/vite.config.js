// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(), // Assurez-vous que c'est le bon plugin pour React
    // Si vous utilisez Tailwind CSS v3, vous n'avez pas besoin de '@tailwindcss/vite'.
    // L'intégration se fait via postcss.config.cjs et package.json.
    // Si vous l'utilisez pour Tailwind v4, c'est correct ici.
    // tailwindcss(), 
    // tsconfigPaths(), // Décommentez si vous l'utilisez pour les alias TypeScript
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      // --- RÈGLE SPÉCIFIQUE POUR LES REQUÊTES /api/ (VOS CONTRÔLEURS ODOO) ---
      '/api': {
        target: 'http://localhost:8069', // Odoo HTTP/API
        changeOrigin: true,
        secure: false, // À mettre à true si votre Odoo est en HTTPS
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With,X-Openerp-Session-Id,Accept,Authorization', 
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': 86400,
              });
              res.end();
              return;
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          });
        }
      },
      // --- RÈGLE SPÉCIFIQUE POUR LES REQUÊTES /web/ (AUTH, ODOO STATIC, ETC.) ---
      '/web': {
        target: 'http://localhost:8069', // Odoo HTTP/API
        changeOrigin: true,
        secure: false,
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With,X-Openerp-Session-Id,Accept,Authorization', 
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': 86400,
              });
              res.end();
              return;
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          });
        }
      },
      // --- RÈGLE SPÉCIFIQUE POUR LES WEBSOCKETS (/websocket) ---
      '/websocket': {
        target: 'ws://localhost:8072', // <-- Notez le ws:// et le port dédié
        ws: true, // Active le support Websocket
        changeOrigin: true,
        secure: false,
        xfwd: true,
        // Pas de gestion CORS pour OPTIONS ici, le handshake WS est différent.
      },
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
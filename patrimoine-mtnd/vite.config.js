// vite.config.js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 5174,
        strictPort: true,
        proxy: {
            // --- DÉBUT DE LA SECTION CRITIQUE ---

            // Règle N°1 : Proxy pour les WebSockets
            // Toutes les requêtes vers '/websocket' seront redirigées vers votre backend Nginx
            '/websocket': {
                target: 'http://localhost:80', // L'adresse de votre Nginx
                ws: true, // **LA LIGNE LA PLUS IMPORTANTE : active le proxying pour les WebSockets**
                changeOrigin: true, // Recommandé pour s'assurer que l'origine est correcte
            },

            // Règle N°2 : Proxy pour tous les autres appels API
            // Redirige toutes les requêtes commençant par '/api' vers Nginx
            '/api': {
                target: 'http://localhost:80',
                changeOrigin: true,
            },
        }
    },
    build: {
        outDir: "dist",
        assetsDir: "assets",
        emptyOutDir: true,
    },
    optimizeDeps: {
        include: ["react", "react-dom", "react-router-dom"],
    },
})

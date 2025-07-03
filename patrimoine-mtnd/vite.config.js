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
            // RÈGLE SIMPLIFIÉE POUR /api
            "/api": {
                target: "http://localhost:8069",
                changeOrigin: true, // Essentiel pour que le proxy fonctionne correctement
                secure: false, // Important si votre Odoo n'est pas en HTTPS
            },
            // RÈGLE SIMPLIFIÉE POUR /web (authentification)
            "/web": {
                target: "http://localhost:8069",
                changeOrigin: true, // Essentiel
                secure: false, // Important
            },
            // La règle pour les websockets peut rester la même
            "/websocket": {
                target: "ws://localhost:8072",
                ws: true,
                changeOrigin: true,
                secure: false,
            },
        },
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

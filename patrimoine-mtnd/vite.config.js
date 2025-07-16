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

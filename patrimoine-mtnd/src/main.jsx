import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "./App"
import "./index.css"

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")).render(
    // Le StrictMode a été retiré d'ici
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
)

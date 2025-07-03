import React from "react"
import { Outlet } from "react-router-dom"
import AppSidebar from "./app-sidebar"
import { Toaster } from "./ui/sonner"

export default function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

    return (
        // Ce conteneur de haut niveau englobe toute la page.
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-10">
            <AppSidebar onCollapseChange={setSidebarCollapsed} />

            {/* Main content */}
            <main
                className={`transition-all duration-300  px-6 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
            >
                <Outlet />
            </main>

            <Toaster position="top-right" />
        </div>
    )
}

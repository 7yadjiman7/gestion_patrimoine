import React, { useState } from "react"
import { Outlet } from "react-router-dom"
import AppSidebar from "./app-sidebar"
import { Toaster } from "./ui/sonner"
import { useIsMobile } from "../hooks/use-is-mobile"
import { Menu, X } from "lucide-react"

export default function AppLayout() {
    const { isMobile, isLarge } = useIsMobile()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Logique pour déterminer si la sidebar doit être visible
    const showSidebar = isLarge || sidebarOpen

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* -- EN-TÊTE DÉDIÉ AUX MOBILES -- */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-20 bg-slate-900 z-50 flex items-center justify-between px-4 border-b border-slate-700">
                    {/* Logo dans l'en-tête mobile */}
                    <img
                        src="/images/logos/logo.png"
                        alt="Logo MTND"
                        className="h-16"
                    />
                    {/* Bouton du menu dans l'en-tête mobile */}
                    <button
                        className="p-2 text-white"
                        onClick={() => setSidebarOpen(prev => !prev)}
                    >
                        {sidebarOpen ? (
                            <X className="h-7 w-7" />
                        ) : (
                            <Menu className="h-7 w-7" />
                        )}
                    </button>
                </div>
            )}

            {/* La sidebar est toujours rendue */}
            <AppSidebar
                isMobile={isMobile}
                isOpen={showSidebar}
                setIsOpen={setSidebarOpen}
            />

            {/* Contenu principal de la page */}
            <main
                className={`transition-all duration-300 ${
                    // Sur mobile, le contenu est toujours à gauche mais avec un padding pour l'en-tête
                    isMobile
                        ? "ml-0 pt-20"
                        : // Sur desktop, on décale en fonction de la sidebar
                          showSidebar
                          ? "ml-64"
                          : "ml-0"
                }`}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>

            <Toaster position="top-right" />
        </div>
    )
}

import {
    AlertCircle,
    BarChart2,
    CheckSquare,
    Home,
    List,
    LogOut,
    Menu,
    Move,
    PlusSquare,
    MessageCircle,
    FileText,
} from "lucide-react"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth, type User } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { usePostNotifications } from "../context/PostNotificationContext"

// On définit les types pour les props que le composant reçoit de AppLayout
interface AppSidebarProps {
    isMobile: boolean
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}

export default function AppSidebar({
    isMobile,
    isOpen,
    setIsOpen,
}: AppSidebarProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentUser, logout } = useAuth()
    const { count } = usePostNotifications()

    // La barre est toujours visible sur desktop, pas de réduction
    const isVisible = isMobile ? isOpen : true
    const isCollapsed = false // Désactivé la réduction sur desktop

    if (!currentUser) {
        return null
    }

    const handleLogout = () => {
        logout()
    }

    // Votre logique de gestion des rôles est conservée
    type UserRole =
        | "admin"
        | "admin_patrimoine"
        | "admin_intranet"
        | "director"
        | "agent"
        | "user"
    const hasRole = (role: UserRole) => {
        if (!currentUser) return false
        const userRole = currentUser.role?.toLowerCase()
        const checkRole = role.toLowerCase()
        if (checkRole === "admin") {
            return (
                userRole === "admin" ||
                userRole === "admin_patrimoine" ||
                userRole === "admin_intranet" ||
                currentUser.is_admin
            )
        }
        return userRole === checkRole
    }
    const isAdminIntranet = currentUser.role === "admin_intranet"

    // Votre structure de menu est conservée
    const menuItems = [
        {
            section: "Intranet",
            items: [
                // {
                //     icon: <MessageCircle className="h-5 w-5" />,
                //     label: "Chat",
                //     path: "/chat",
                // },
                {
                    icon: <FileText className="h-5 w-5" />,
                    label: "Posts",
                    path: "/posts",
                },
            ],
        },
        ...(hasRole("admin")
            ? [
                  {
                      section: "Admin",
                      items: [
                          {
                              icon: <BarChart2 className="h-5 w-5" />,
                              label: "Dashboard",
                              path: "/admin/statistiques",
                          },
                          {
                              icon: <Home className="h-5 w-5" />,
                              label: "Materiels",
                              path: "/admin",
                          },
                          {
                              icon: <PlusSquare className="h-5 w-5" />,
                              label: "Ajouter Matériel",
                              path: "/admin/ajouter",
                          },
                          ...(!isAdminIntranet
                              ? [
                                    {
                                        icon: <List className="h-5 w-5" />,
                                        label: "Demandes de Matériels",
                                        path: "/admin/demandes",
                                    },
                                ]
                              : []),
                          {
                              icon: <Move className="h-5 w-5" />,
                              label: "Mouvement",
                              path: "/admin/mouvement",
                          },
                          ...(!isAdminIntranet
                              ? [
                                    {
                                        icon: (
                                            <AlertCircle className="h-5 w-5" />
                                        ),
                                        label: "Déclarations de Pertes",
                                        path: "/admin/pertes",
                                    },
                                ]
                              : []),
                          ...(isAdminIntranet
                              ? [
                                    {
                                        icon: <List className="h-5 w-5" />,
                                        label: "Faire Demande",
                                        path: "/director/demandes",
                                    },
                                    {
                                        icon: (
                                            <AlertCircle className="h-5 w-5" />
                                        ),
                                        label: "Déclarer Perte",
                                        path: "/declaration-pertes",
                                    },
                                    {
                                        icon: <FileText className="h-5 w-5" />,
                                        label: "Tableau des posts",
                                        path: "/admin/posts",
                                    },
                                ]
                              : []),
                      ],
                  },
              ]
            : []),
        ...(hasRole("director")
            ? [
                  {
                      section: "Directeur",
                      items: [
                          {
                              icon: <Home className="h-5 w-5" />,
                              label: "Page d'Accueil",
                              path: "/director/dashboard",
                          },
                          {
                              icon: <List className="h-5 w-5" />,
                              label: "Faire Demande",
                              path: "/director/demandes",
                          },
                          {
                              icon: <CheckSquare className="h-5 w-5" />,
                              label: "Validation Pertes",
                              path: "/director/validation-pertes",
                          },
                      ],
                  },
              ]
            : []),
        // ... (vos autres sections 'manager' et 'agent' ici) ...
    ]

    // Si la barre ne doit pas être visible (ex: fermée sur mobile), on ne rend rien
    if (!isVisible) {
        return null
    }

    return (
        <>
            {/* Overlay qui n'apparaît que sur mobile quand le menu est ouvert */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            <aside
                className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
                    isMobile ? "z-50 w-64 mt-20" : "z-10 w-64"
                }`}
            >
                {!isMobile && (
                    <div
                        className={`p-4 border-b border-slate-700 flex items-center justify-between`}
                    >
                        <img
                            src="/images/logos/logo.png"
                            alt="Logo MTND"
                            className="h-24 transition-all duration-300"
                        />
                    </div>
                )}

                <nav className="p-2 space-y-4 mt-4">
                    {menuItems.map(section => (
                        <div key={section.section}>
                            {
                                <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {section.section}
                                </h3>
                            }
                            {section.items.map(
                                (item: {
                                    icon: React.ReactNode
                                    label: string
                                    path: string
                                }) => {
                                    const isActive =
                                        location.pathname === item.path
                                    return (
                                        <Button
                                            key={item.path}
                                            variant="ghost"
                                            className={`w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"}`}
                                            onClick={() => {
                                                // Notification count handling removed
                                                navigate(item.path)
                                                if (isMobile) setIsOpen(false) // Ferme le menu après un clic sur mobile
                                            }}
                                        >
                                            <div className="flex-shrink-0">
                                                {item.icon}
                                            </div>
                                            {!isCollapsed && (
                                                <span className="flex-grow text-left flex items-center justify-between">
                                                    <span>{item.label}</span>
                                                    {/* Notification badge removed */}
                                                </span>
                                            )}
                                        </Button>
                                    )
                                }
                            )}
                        </div>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-2 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isCollapsed && (
                            <span className="flex-grow text-left">
                                Déconnexion
                            </span>
                        )}
                    </Button>
                </div>
            </aside>
        </>
    )
}

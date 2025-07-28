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
        ...(hasRole("agent")
            ? [
                  {
                      section: "Agent",
                      items: [
                          {
                              icon: <Home className="h-5 w-5" />,
                              label: "Page d'Accueil",
                              path: "/agent/dashboard",
                          },
                          {
                              icon: <List className="h-5 w-5" />,
                              label: "Déclarer une perte",
                              path: "declaration-pertes",
                          },
                          {
                              icon: <CheckSquare className="h-5 w-5" />,
                              label: "Déclarer une panne",
                              path: "declaration-pannes",
                          },
                      ],
                  },
              ]
            : []),
    ]

    
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
                className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 transition-transform duration-300 ease-in-out flex flex-col ${
                    // Notez : transition-transform
                    isMobile ? "z-50 w-64 mt-20" : "z-10 w-64"
                } ${
                    isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
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

                <nav className="flex-grow p-2 space-y-2 mt-2 overflow-y-auto">
                    {menuItems.map(section => (
                        <div key={section.section}>
                            <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {section.section}
                            </h3>
                            {section.items.map(item => {
                                const isActive = location.pathname === item.path
                                return (
                                    <Button
                                        key={item.path}
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"}`}
                                        onClick={() => {
                                            navigate(item.path)
                                            if (isMobile) setIsOpen(false)
                                        }}
                                    >
                                        <div className="flex-shrink-0">
                                            {item.icon}
                                        </div>
                                        <span className="flex-grow text-left">
                                            {item.label}
                                        </span>
                                    </Button>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                <div className="w-full p-2 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="flex-grow text-left">Déconnexion</span>
                    </Button>
                </div>
            </aside>
        </>
    )
}

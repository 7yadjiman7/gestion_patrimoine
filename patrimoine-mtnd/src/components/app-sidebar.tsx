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

interface AppSidebarProps {
    onCollapseChange?: (collapsed: boolean) => void
}

export default function AppSidebar({ onCollapseChange }: AppSidebarProps) {
    const navigate = useNavigate()
    const location = useLocation() // Hook pour connaître la page active
    const [collapsed, setCollapsed] = React.useState(false)

    const { currentUser, logout } = useAuth()

    if (!currentUser) {
        console.error('No current user - redirecting to login')
        return <div>Chargement...</div>
    }

    const handleLogout = () => {
        logout()
    }

    // Enhanced role checking with admin_patrimoine support
    type UserRole = 'admin' | 'admin_patrimoine' | 'director' | 'agent' | 'user'
    const hasRole = (role: UserRole) => {
        if (!currentUser) {
            console.warn('No current user found')
            return false
        }
        
        const userRole = currentUser.role?.toLowerCase()
        const checkRole = role.toLowerCase()
        
        
        // Special case for admin roles
        if (checkRole === 'admin') {
            return userRole === 'admin' ||
                   userRole === 'admin_patrimoine' ||
                   currentUser.is_admin
        }
        
        return userRole === checkRole
    }
    
    // Filtrer les sections selon le rôle
    const menuItems = [
        {
            section: "Intranet",
            items: [
                {
                    icon: <MessageCircle className="h-5 w-5" />,
                    label: "Chat",
                    path: "/chat",
                },
                {
                    icon: <FileText className="h-5 w-5" />,
                    label: "Posts",
                    path: "/posts",
                },
            ],
        },
        ...(hasRole('admin') ? [{
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
                {
                    icon: <List className="h-5 w-5" />,
                    label: "Demandes de Matériels",
                    path: "/admin/demandes",
                },
                {
                    icon: <Move className="h-5 w-5" />,
                    label: "Mouvement",
                    path: "/admin/mouvement",
                },
                {
                    icon: <AlertCircle className="h-5 w-5" />,
                    label: "Déclarations de Pertes",
                    path: "/admin/pertes",
                },
                {
                    icon: <FileText className="h-5 w-5" />,
                    label: "Tableau des posts",
                    path: "/admin/posts",
                },
            ],
        }] : []),
        ...(hasRole('director') ? [{
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
        }] : []),
        ...(hasRole('agent') ? [{
            section: "Agent",
            items: [
                {
                    icon: <Home className="h-5 w-5" />,
                    label: "Page d'Accueil",
                    path: "/agent",
                },
                {
                    icon: <AlertCircle className="h-5 w-5" />,
                    label: "Déclarer Perte",
                    path: "/declaration-pertes",
                },
            ],
        }] : []),
    ]

    return (
        // Changement du fond en sombre et de la couleur de la bordure
        <aside
            className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 z-50 ${collapsed ? "w-20" : "w-64"}`}
        >
            <div
                className={`p-4 border-b border-slate-700 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
            >
                {!collapsed && (
                    <img
                        src="/images/logos/logo.png"
                        alt="Logo MTND"
                        className="h-20" // Taille légèrement ajustée
                    />
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        const newCollapsed = !collapsed
                        setCollapsed(newCollapsed)
                        onCollapseChange?.(newCollapsed)
                    }}
                    // Couleur des icônes adaptée au thème sombre
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <nav className="p-2 space-y-4 mt-4">
                {menuItems.map(section => (
                    <div key={section.section}>
                        {!collapsed && (
                            <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {section.section}
                            </h3>
                        )}
                        {section.items.map((item: { icon: React.ReactNode, label: string, path: string }) => {
                            const isActive = location.pathname === item.path
                            return (
                                <Button
                                    key={item.path}
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                    ${collapsed ? "justify-center" : ""}
                    ${
                        isActive
                            ? "bg-slate-700 text-white"
                            : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    }`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <div className="flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    {!collapsed && (
                                        <span className="flex-grow text-left">
                                            {item.label}
                                        </span>
                                    )}
                                </Button>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className="absolute bottom-0 w-full p-2 border-t border-slate-700">
                <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 px-4 py-3 text-sm font-medium transition-colors
            ${collapsed ? "justify-center" : ""}
            text-slate-400 hover:bg-red-500/10 hover:text-red-400
          `}
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && (
                        <span className="flex-grow text-left">Déconnexion</span>
                    )}
                </Button>
            </div>
        </aside>
    )
}

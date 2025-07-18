import axios from "axios"
import React, { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/services/apiConfig"

const ODOO_DB = import.meta.env.VITE_ODOO_DB || "odoo17_2"

// On ajoute les champs optionnels pour le département à l'interface User
export interface User {
    id: number
    name: string
    email: string
    session_id?: string
    is_admin: boolean
    is_intranet_admin: boolean
    role: "admin" | "admin_patrimoine" | "admin_intranet" | "director" | "agent" | "user"
    department_id?: number
    department_name?: string
}

interface AuthContextType {
    currentUser: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<User>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const navigate = useNavigate()

    const logout = () => {
        setCurrentUser(null)
        localStorage.removeItem("odoo_user")
        localStorage.removeItem("odoo_session_id")
        navigate("/login")
    }

    useEffect(() => {
        const storedUser = localStorage.getItem("odoo_user")
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = async (email: string, password: string): Promise<User> => {
        try {
            const authRes = await api.post(
                "/web/session/authenticate",
                {
                    jsonrpc: "2.0",
                    params: { login: email, password, db: ODOO_DB },
                },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )

            const session = authRes.data.result
            if (!session?.uid) {
                throw new Error("Authentification échouée ou UID manquant.")
            }

            localStorage.setItem("odoo_session_id", session.session_id)

            const infoRes = await api.post("/api/users/me", {}, { withCredentials: true })
            const userInfo = infoRes.data.result
            if (!userInfo) {
                throw new Error(
                    "Impossible de récupérer les informations détaillées de l'utilisateur."
                )
            }

            const isAdmin =
                userInfo.roles.includes("admin") || userInfo.roles.includes("admin_patrimoine")
            const isIntranetAdmin = userInfo.roles.includes("admin_intranet")

            let userRole: User["role"] = "user"
            if (isAdmin) {
                userRole = "admin_patrimoine"
            } else if (isIntranetAdmin) {
                userRole = "admin_intranet"
            } else if (userInfo.roles.includes("director")) {
                userRole = "director"
            } else if (userInfo.roles.includes("agent")) {
                userRole = "agent"
            }

            const finalUserData: User = {
                id: userInfo.uid,
                name: userInfo.name,
                email: userInfo.username,
                session_id: session.session_id,
                is_admin: isAdmin,
                is_intranet_admin: isIntranetAdmin,
                role: userRole,
                department_id: userInfo.department_id,
                department_name: userInfo.department_name,
            }

            setCurrentUser(finalUserData)
            localStorage.setItem("odoo_user", JSON.stringify(finalUserData))

            return finalUserData
        } catch (error: unknown) {
            logout()
            console.error("Erreur détaillée de connexion:", error)
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.error?.data?.message || "Identifiants incorrects"
                )
            }
            if (error instanceof Error) {
                throw new Error(error.message)
            }
            throw new Error("Erreur inconnue lors de l'authentification")
        }
    }

    const value = { currentUser, loading, login, logout }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

import React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

// Composant spinner simple avec fondu
function Spinner({ show }) {
    return (
        <div
            className={`inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent transition-opacity ${show ? "animate-fade-in opacity-100" : "animate-fade-out opacity-0"}`}
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { login } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        setIsLoading(true)
        setError("") // Réinitialiser les erreurs précédentes

        try {
            // 1. Attendre les informations de l'utilisateur après le login
            const user = await login(email, password)

            // 2. Déterminer la page de destination en fonction du rôle
            let targetPath = "/agent" // Page par défaut pour les utilisateurs
            if (user.is_admin) {
                targetPath = "/admin"
            } else if (user.role === "director") {
                targetPath = "/director/dashboard"
            }

            // 3. Rediriger l'utilisateur vers la bonne page
            navigate(targetPath, { replace: true })
        } catch (err) {
            setError(err.message || "Identifiants incorrects")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="animate-fade-in opacity-0">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/images/logos/logo.png"
                            alt="Logo MTND"
                            className="h-20"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-6">
                        Connexion à Odoo
                    </h2>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full cursor-pointer flex items-center justify-center"
                        disabled={isLoading}
                    >
                        <Spinner show={isLoading} />
                        {isLoading ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                </form>
            </div>
            </div>
        </div>
    )
}

import React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

// Composant spinner simple avec fondu
// Pas de changement nécessaire ici
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
            const user = await login(email, password)
            const targetPath = "/posts" // Page par défaut
            navigate(targetPath, { replace: true })
        } catch (err) {
            setError(err.message || "Identifiants incorrects")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        // Le conteneur principal prend tout l'écran et centre son contenu.
        // On ajoute un padding `p-4` pour que le formulaire ne colle pas aux bords sur mobile.
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="animate-fade-in opacity-0 w-full">
                {/* * CORRECTION RESPONSIVE :
                 * 1. `w-full` : prend toute la largeur disponible sur mobile.
                 * 2. `sm:max-w-md` : À partir des petits écrans (sm), on limite la largeur maximale à `md` (medium).
                 * 3. `mx-auto` : Centre le formulaire horizontalement sur les écrans plus larges.
                 * 4. `p-6 sm:p-8` : Le padding interne est plus petit sur mobile (p-6) et plus grand sur les autres écrans (sm:p-8).
                 */}
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full sm:max-w-md mx-auto">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/images/logos/logo.png"
                            alt="Logo MTND"
                            className="h-25"
                        />
                    </div>
                    {/*
                     * CORRECTION RESPONSIVE :
                     * La taille du titre s'adapte également à la taille de l'écran.
                     */}
                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
                        Connexion à l'Intranet
                    </h2>
                    {error && (
                        <p className="text-red-500 mb-4 text-center">{error}</p>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="mt-1" // Ajoute un petit espace
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
                                className="mt-1" // Ajoute un petit espace
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full cursor-pointer flex items-center justify-center text-base py-3" // Augmente légèrement la taille du bouton
                            disabled={isLoading}
                        >
                            <Spinner show={isLoading} />
                            {isLoading
                                ? "Connexion en cours..."
                                : "Se connecter"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

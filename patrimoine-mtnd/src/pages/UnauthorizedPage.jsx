// src/pages/UnauthorizedPage.jsx
import React from "react"
import { Link } from "react-router-dom"

export default function UnauthorizedPage() {
    return (
        <div>
            <h1>Accès Non Autorisé</h1>
            <p>
                Vous n'avez pas les permissions nécessaires pour voir cette
                page.
            </p>
            <Link to="/">Retour à l'accueil</Link>
        </div>
    )
}

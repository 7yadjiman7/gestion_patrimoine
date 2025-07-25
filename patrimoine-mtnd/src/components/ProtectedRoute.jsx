// src/components/ProtectedRoute.jsx

import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = ({ children, roles }) => {
    const { currentUser, loading } = useAuth()
    const location = useLocation()


    if (loading) {
        return <div>Chargement de la session...</div>
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (roles && !roles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}

export default ProtectedRoute

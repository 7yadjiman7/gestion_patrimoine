// components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/authService'; // Assurez-vous que le chemin est correct

// roles est un tableau des rôles autorisés, ex: ['director', 'admin_patrimoine']
export default function ProtectedRoute({ children, roles }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
        // On garde en mémoire la page qu'il voulait visiter pour l'y rediriger après connexion
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Vérifier si la liste de rôles de l'utilisateur contient au moins un des rôles requis
    const hasRequiredRole = user.roles && user.roles.some(role => roles.includes(role));

    if (!hasRequiredRole) {
        // Si l'utilisateur est connecté mais n'a pas le bon rôle,
        // le rediriger vers une page "Accès non autorisé" ou la page d'accueil
        return <Navigate to="/unauthorized" replace />;
    }

    // Si tout est bon, afficher le composant enfant (la page protégée)
    return children;
}
// src/components/ui/ApiImage.jsx

import React from 'react';
import { API_BASE_URL } from '@/services/api'; // On importe la base de l'URL ici, une seule fois.

/**
 * Un composant <img> qui préfixe automatiquement les URLs relatives
 * avec la base de l'API et gère les images manquantes.
 */
const ApiImage = ({ src, alt, className, style, placeholder = '/placeholder.jpeg', ...props }) => {
  // Si la source est vide ou invalide, on utilise une image par défaut.
  if (!src || typeof src !== 'string') {
    return <img src={placeholder} alt={alt || 'Image par défaut'} className={className} style={style} {...props} />;
  }

  // On construit l'URL complète seulement si la source est un chemin relatif (ne commence pas par http).
  const fullSrc = src.startsWith('http') ? src : `${API_BASE_URL}${src}`;

  return (
    <img
      src={fullSrc}
      alt={alt || 'Image de l-API'}
      className={className}
      style={style}
      {...props}
      // Bonus : si l'image ne se charge pas, on affiche le placeholder.
      onError={(e) => {
        e.target.onerror = null; // Empêche une boucle d'erreurs
        e.target.src = placeholder;
      }}
    />
  );
};

export default ApiImage;

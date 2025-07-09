import { useState, useEffect } from 'react';

// Nom de la base de données Odoo. Peut être configuré via la variable
// d'environnement VITE_ODOO_DB. Si elle n'est pas définie, on utilise
// "odoo17_2" par défaut pour conserver un comportement compatible.
const ODOO_DB = import.meta.env.VITE_ODOO_DB || 'odoo17_2';


// Interface pour la réponse de notre nouvelle route /api/users/me
interface UserInfoResponse {
  uid: number;
  name: string;
  username: string;
  roles: string[]; // <-- Le champ clé !
  department_id: number | null;
  department_name: string | null;
}

// Interface pour la réponse attendue de l'authentification Odoo
interface LoginResponse {
  result: {
    uid: number;
    session_id: string;
    username: string;
    is_system?: boolean;
    is_admin?: boolean;
    role?: string;
  };
  error?: {
    message: string;
    data?: {
      message: string;
      // ... autres détails d'erreur
    };
  };
}

// Données utilisateur finalement stockées dans localStorage
export interface FinalUserData extends LoginResponse['result'] {
  name: string;
  roles: string[];
  department_id: number | null;
  department_name: string | null;
  role: string;
}

export const login = async (
  email: string,
  password: string
): Promise<FinalUserData> => {
  const requestUrl = `/web/session/authenticate`;

  try {
    // --- Étape A : Authentification initiale auprès d'Odoo ---
    const authResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        params: { db: ODOO_DB, login: email, password: password },
      }),
      credentials: 'include',
    });

    if (!authResponse.ok) {
      throw new Error(`Échec de la connexion (HTTP ${authResponse.status})`);
    }

    const authData: LoginResponse = await authResponse.json();

    if (authData.error) {
      throw new Error(authData.error.data?.message || authData.error.message);
    }
    if (!authData.result?.uid) {
      throw new Error('Connexion réussie mais données utilisateur manquantes.');
    }

    // Stockage temporaire de la session ID pour l'appel suivant
    localStorage.setItem('odoo_session_id', authData.result.session_id);

    // --- Étape B : Récupération des rôles et des détails de l'utilisateur ---
    const userInfoResponse = await fetch('/api/users/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Envoie le cookie de session que nous venons d'obtenir
    });

    if (!userInfoResponse.ok) {
        // Si cet appel échoue, on nettoie et on lève une erreur
        localStorage.removeItem('odoo_session_id');
        throw new Error("Impossible de récupérer les informations de l'utilisateur après connexion.");
    }
    
    const userInfo: UserInfoResponse = await userInfoResponse.json();

    // --- Étape C : Stockage final des données utilisateur complètes ---
    const finalUserData: FinalUserData = {
      ...authData.result, // Contient session_id, uid, etc.
      ...userInfo,     // Contient name, username, et surtout les RÔLES
      // On choisit un rôle principal pour la logique de redirection
      // Par exemple, le premier rôle de la liste ou le plus élevé
      role: userInfo.roles[0] || 'user'
    };
    
    localStorage.setItem('odoo_user', JSON.stringify(finalUserData));
    
    return finalUserData;

  } catch (error: unknown) {
    console.error('Erreur attrapée dans authService.login:', error);
    localStorage.removeItem('odoo_session_id'); // Nettoyage en cas d'erreur
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('Échec de la connexion au serveur.');
    }
  }
};

// Hook useAuth pour gérer l'état d'authentification global de l'application
export const useAuth = () => {
  const [user, setUser] = useState<FinalUserData | null>(() => {
    // Tente de récupérer l'utilisateur depuis localStorage au démarrage
    const storedUser = localStorage.getItem('odoo_user');
    return storedUser ? (JSON.parse(storedUser) as FinalUserData) : null;
  });

  useEffect(() => {
    // Écoute les changements dans localStorage (par d'autres onglets/fenêtres)
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('odoo_user');
      setUser(storedUser ? (JSON.parse(storedUser) as FinalUserData) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fournit l'état de l'utilisateur et une fonction pour le mettre à jour (ex: après connexion/déconnexion)
  return { user, setUser };
};

// Fonction de déconnexion
export const logout = async (): Promise<void> => {
  // Ici, nous utilisons des chemins relatifs car le proxy Vite doit également gérer la déconnexion
  const requestUrl = `/web/session/destroy`; // Assurez-vous que Vite proxyfie '/web'


  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      credentials: 'include', // Essentiel pour que les cookies de session soient envoyés
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Échec HTTP lors de la déconnexion:', response.status, errorText);
      throw new Error(`Échec de la déconnexion (HTTP ${response.status}): ${errorText.substring(0, 150)}...`);
    }

    // Optionnel: vérifier si la réponse est JSON et contient un succès,
    // mais /web/session/destroy renvoie souvent un corps vide en cas de succès.
    // const data = await response.json(); 

    localStorage.removeItem('odoo_session_id'); // Supprime la session ID
    localStorage.removeItem('odoo_user');      // Supprime les données utilisateur
    // Note: Le setUser du useAuth devra être appelé manuellement par le composant appelant ou par l'événement 'storage'

  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error);
    throw new Error(error.message || 'Échec de la déconnexion du serveur.');
  }
};
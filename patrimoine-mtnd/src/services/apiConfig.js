// apiConfig.js
import axios from "axios"

const api = axios.create({
    // IMPORTANT : baseURL vide pour que Vite Proxy intercepte les requêtes relatives
    baseURL: '', 
    headers: {
        "Content-Type": "application/json",
        // 'Access-Control-Allow-Origin': '*', // <-- SUPPRIMER CES LIGNES DE CORS MANUELLES
        // 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
        // Authorization: localStorage.getItem("authToken") ? `Bearer ${localStorage.getItem("authToken")}` : "", // <-- SUPPRIMER CETTE LIGNE
    },
    withCredentials: true, // IMPORTANT : Pour que les cookies de session Odoo soient envoyés/reçus
})

export default api

export const getApiUrl = () => {
    // Retourne le VITE_API_URL pour le débogage si besoin d'afficher l'URL complète
    return import.meta.env.VITE_API_URL || "http://localhost:8069"
}

export const apiConfig = {
    API_BASE_URL: "", // Confirme que la base est vide pour les requêtes relatives
    ENDPOINTS: {
        // --- Endpoints pour les opérations sur les ASSETS (Patrimoine.asset) ---
        ITEM_DETAILS: (itemId) => `/api/patrimoine/assets/${itemId}`, // Pour fetchMaterialDetails (détail d'un item)
        CREATE_ITEM: '/api/patrimoine/items', // Pour createItem (nouvel enregistrement)

        // --- Endpoints pour la CATÉGORISATION (asset.category, asset.subcategory, asset.custom.field) ---
        // Utilisés par fetchTypesGeneraux, fetchSubcategories, fetchCustomFields
        CATEGORIES: () => '/api/patrimoine/categories', // Pour list_categories (types généraux)
        SUBCATEGORIES: (categoryId) => `/api/patrimoine/subcategories/${categoryId}`, // Pour list_subcategories
        CUSTOM_FIELDS: (subcategoryId) => `/api/patrimoine/subcategories/${subcategoryId}/fields`, // Pour list_fields

        // --- Endpoints pour les STATS ---
        // NOUVELLES CONSTANTES POUR LES ROUTES DÉDIÉES AU FILTRAGE D'ASSETS
        ALL_ASSETS: '/api/patrimoine/assets', // La route sans aucun filtre spécifique dans l'URL
        ASSETS_BY_TYPE: (generalType) => `/api/patrimoine/assets/type/${generalType}`,
        ASSETS_BY_SUBCATEGORY: (subcategoryCode) => `/api/patrimoine/assets/category/${subcategoryCode}`,

        // NOUVELLES CONSTANTES POUR LES ROUTES DÉDIÉES AU FILTRAGE DE STATS
        GENERAL_STATS: '/api/patrimoine/stats', // Stats générales
        STATS_BY_TYPE: '/api/patrimoine/stats/by_type',
        STATS_BY_SUBCATEGORY: (subcategoryCode) => `/api/patrimoine/stats/category/${subcategoryCode}`,

        // Endpoints pour les dropdowns et autres données de référence
        LOCATIONS: '/api/patrimoine/locations',
        EMPLOYEES: '/api/patrimoine/employees',
        DEPARTMENTS: '/api/patrimoine/departments',
        FOURNISSEURS: '/api/patrimoine/fournisseurs',

        // Endpoints pour les mouvements
        MOVEMENT_CREATE: '/api/patrimoine/mouvements',
        MOVEMENT_VALIDATE: (mouvementId) => `/api/patrimoine/mouvements/${mouvementId}/validate`,

        // Endpoint pour l'impression de la fiche de vie
        PRINT_FICHE_VIE: (assetId) => `/api/patrimoine/assets/${assetId}/print_fiche_vie`,


        // Endpoints pour les demandes de matériel
        DEMANDES_LIST: '/api/patrimoine/demandes', // Pour fetchDemandes
        DEMANDES_CREATE: '/api/patrimoine/demandes', // Pour createDemande
        DEMANDES_PROCESS: (demandeId, action) => `/api/patrimoine/demandes/${demandeId}/${action}`, // Pour processDemande


        // --- Endpoints pour les Déclarations de Perte ---
        PERTES_CREATE: '/api/patrimoine/pertes',
        PERTES_LIST: '/api/patrimoine/pertes', // GET: Pour lister toutes les déclarations
        PERTES_PROCESS: (perteId) => `/api/patrimoine/pertes/${perteId}/process`, // POST: Pour confirmer/rejeter

        // --- NOUVEAUX ENDPOINTS POUR LES STATISTIQUES SPÉCIFIQUES ---
        STATS_BY_DEPARTMENT: '/api/patrimoine/stats/by_department',
        STATS_BY_DETAILED_CATEGORY: '/api/patrimoine/stats/by_detailed_category',

    },
   
    HEADERS: { // Ces headers sont des valeurs par défaut pour l'instance Axios
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Un header courant pour les requêtes AJAX
    }
};

// apiConfig.js - Configuration optimisée pour Odoo
import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/',
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    },
    withCredentials: true, // Essentiel pour les cookies de session
})
// Intercepteur de requête amélioré
api.interceptors.request.use(
    config => {
        // Gestion de la session
        const sessionId = localStorage.getItem("odoo_session_id")
        if (sessionId) {
            config.headers["X-Openerp-Session-Id"] = sessionId
        }

        return config
    },
    error => Promise.reject(error)
)

// Add response interceptor to handle CORS errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.code === "ERR_NETWORK" || error.message.includes("CORS")) {
            console.error("CORS Error:", error)
            throw new Error(
                "Failed to connect to API server. Please check your network and CORS settings."
            )
        }
        return Promise.reject(error)
    }
)

export default api

export const apiConfig = {
    ENDPOINTS: {
        // --- Endpoints pour les opérations sur les ASSETS (Patrimoine.asset) ---
        ITEM_DETAILS: itemId => `/api/patrimoine/assets/${itemId}`, // Pour fetchMaterialDetails (détail d'un item)
        CREATE_ITEM: "/api/patrimoine/items", // Pour createItem (nouvel enregistrement)

        // --- Endpoints pour la CATÉGORISATION (asset.category, asset.subcategory, asset.custom.field) ---
        // Utilisés par fetchTypesGeneraux, fetchSubcategories, fetchCustomFields
        CATEGORIES: () => "/api/patrimoine/categories", // Pour list_categories (types généraux)
        SUBCATEGORIES: categoryId =>
            `/api/patrimoine/subcategories/${categoryId}`, // Pour list_subcategories
        CUSTOM_FIELDS: subcategoryId =>
            `/api/patrimoine/subcategories/${subcategoryId}/fields`, // Pour list_fields

        // --- Endpoints pour les STATS ---
        // NOUVELLES CONSTANTES POUR LES ROUTES DÉDIÉES AU FILTRAGE D'ASSETS
        ALL_ASSETS: "/api/patrimoine/assets", // La route sans aucun filtre spécifique dans l'URL
        USER_ASSETS: "/api/patrimoine/assets/user", // Pour fetchMaterialsByUser (biens affectés à l'utilisateur)
        ASSETS_BY_TYPE: generalType =>
            `/api/patrimoine/assets/type/${generalType}`,
        ASSETS_BY_SUBCATEGORY: subcategoryCode =>
            `/api/patrimoine/assets/category/${subcategoryCode}`,

        // NOUVELLES CONSTANTES POUR LES ROUTES DÉDIÉES AU FILTRAGE DE STATS
        GENERAL_STATS: "/api/patrimoine/stats", // Stats générales
        STATS_BY_TYPE: "/api/patrimoine/stats/by_type", // Stats par type de matériel
        STATS_BY_TYPE_FILTERED: generalType =>
            `/api/patrimoine/stats/type/${generalType}`,
        STATS_BY_SUBCATEGORY: subcategoryCode =>
            `/api/patrimoine/stats/category/${subcategoryCode}`,

        // Endpoints pour les dropdowns et autres données de référence
        LOCATIONS: "/api/patrimoine/locations",
        EMPLOYEES: "/api/patrimoine/employees",
        DEPARTMENTS: "/api/patrimoine/departments",
        FOURNISSEURS: "/api/patrimoine/fournisseurs",

        // Endpoints pour les mouvements
        MOVEMENT_CREATE: "/api/patrimoine/mouvements",
        MOVEMENT_VALIDATE: mouvementId =>
            `/api/patrimoine/mouvements/${mouvementId}/validate`,

        // Endpoint pour l'impression de la fiche de vie
        PRINT_FICHE_VIE: assetId =>
            `/api/patrimoine/assets/${assetId}/print_fiche_vie`,

        // Endpoints pour les demandes de matériel
        DEMANDES_LIST: "/api/patrimoine/demandes", // Pour fetchDemandes
        DEMANDES_DETAILS: demandeId =>
            `/api/patrimoine/demande_materiel/${demandeId}`, // Pour fetchDemandeDetails
        DEMANDES_CREATE: "/api/patrimoine/demandes", // Pour createDemande
        APPROVE_DEMANDE: demandeId =>
            `/api/patrimoine/demandes/${demandeId}/approval`,
        REJECT_DEMANDE: demandeId =>
            `/api/patrimoine/demandes/${demandeId}/rejection`,

        // --- Endpoints pour les Déclarations de Perte ---
        PERTES_CREATE: "/api/patrimoine/pertes",
        PERTES_LIST: "/api/patrimoine/pertes", // GET: Pour lister toutes les déclarations
        PERTES_PROCESS: perteId => `/api/patrimoine/pertes/${perteId}/process`, // POST: Pour confirmer/rejeter

        // --- NOUVEAUX ENDPOINTS POUR LES STATISTIQUES SPÉCIFIQUES ---
        STATS_BY_DEPARTMENT: "/api/patrimoine/stats/by_department",
        // STATS_BY_TYPE: '/api/patrimoine/stats/by_type',
        STATS_BY_DETAILED_CATEGORY:
            "/api/patrimoine/stats/by_detailed_category",
    },

    HEADERS: {
        // Ces headers sont des valeurs par défaut pour l'instance Axios
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Un header courant pour les requêtes AJAX
    },
}

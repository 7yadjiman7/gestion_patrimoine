import axios from "axios"
import { API_BASE_URL } from "@/config/api"

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
    withCredentials: true,
})

api.interceptors.request.use(
    config => {
        const sessionId = localStorage.getItem("odoo_session_id")
        if (sessionId) {
            config.headers["X-Openerp-Session-Id"] = sessionId
        }
        if (process.env.NODE_ENV !== "production") {
            console.debug("Request:", {
                method: config.method,
                url: `${config.baseURL || ''}${config.url}`,
                data: config.data,
            })
        }
        return config
    },
    error => Promise.reject(error)
)

api.interceptors.response.use(
    response => {
        if (process.env.NODE_ENV !== "production") {
            console.debug(`Response from ${response.config.url}:`, {
                status: response.status,
                data: response.data,
            })
        }
        return response
    },
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
        ITEM_DETAILS: itemId => `/api/patrimoine/assets/${itemId}`,
        CREATE_ITEM: "/api/patrimoine/items",
        CATEGORIES: () => "/api/patrimoine/categories",
        SUBCATEGORIES: categoryId =>
            `/api/patrimoine/subcategories/${categoryId}`,
        CUSTOM_FIELDS: subcategoryId =>
            `/api/patrimoine/subcategories/${subcategoryId}/fields`,
        ALL_ASSETS: "/api/patrimoine/assets",
        USER_ASSETS: "/api/patrimoine/assets/user",
        ASSETS_BY_TYPE: generalType =>
            `/api/patrimoine/assets/type/${generalType}`,
        ASSETS_BY_SUBCATEGORY: subcategoryCode =>
            `/api/patrimoine/assets/category/${subcategoryCode}`,
        GENERAL_STATS: "/api/patrimoine/stats",
        STATS_BY_TYPE: "/api/patrimoine/stats/by_type",
        STATS_BY_TYPE_FILTERED: generalType =>
            `/api/patrimoine/stats/type/${generalType}`,
        STATS_BY_SUBCATEGORY: subcategoryCode =>
            `/api/patrimoine/stats/category/${subcategoryCode}`,
        LOCATIONS: "/api/patrimoine/locations",
        EMPLOYEES: "/api/patrimoine/employees",
        DEPARTMENTS: "/api/patrimoine/departments",
        FOURNISSEURS: "/api/patrimoine/fournisseurs",
        MOVEMENT_CREATE: "/api/patrimoine/mouvements",
        MOVEMENT_VALIDATE: mouvementId =>
            `/api/patrimoine/mouvements/${mouvementId}/validate`,
        PRINT_FICHE_VIE: assetId =>
            `/api/patrimoine/assets/${assetId}/print_fiche_vie`,
        DEMANDES_LIST: "/api/patrimoine/demandes",
        DEMANDES_DETAILS: demandeId =>
            `/api/patrimoine/demande_materiel/${demandeId}`,
        DEMANDES_CREATE: "/api/patrimoine/demandes",
        APPROVE_DEMANDE: demandeId =>
            `/api/patrimoine/demandes/${demandeId}/approval`,
        REJECT_DEMANDE: demandeId =>
            `/api/patrimoine/demandes/${demandeId}/rejection`,
        PERTES_CREATE: "/api/patrimoine/pertes",
        PERTES_LIST: "/api/patrimoine/pertes",
        PERTES_PROCESS: perteId => `/api/patrimoine/pertes/${perteId}/process`,
        STATS_BY_DEPARTMENT: "/api/patrimoine/stats/by_department",
        STATS_FOR_DEPARTMENT: deptId =>
            `/api/patrimoine/stats/department/${deptId}`,
        STATS_BY_DETAILED_CATEGORY:
            "/api/patrimoine/stats/by_detailed_category",
    },
    HEADERS: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
}

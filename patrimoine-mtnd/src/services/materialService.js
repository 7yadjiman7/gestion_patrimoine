// services/materialService.js (Version Complète et Corrigée)
import api from "./apiConfig"

// --- Fonctions de récupération de listes de données ---

const fetchMaterials = async () => {
    try {
        const response = await api.get("/api/patrimoine/assets")
        return response.data
    } catch (error) {
        console.error("Error fetching materials:", error)
        throw error
    }
}

const fetchMaterialsByUser = async () => {
    try {
        const response = await api.get("/api/patrimoine/assets/user")
        return response.data
    } catch (error) {
        console.error("Error fetching user materials:", error)
        throw error
    }
}

const fetchMaterialDetails = async id => {
    try {
        const response = await api.get(`/api/patrimoine/assets/${id}`)

        // CORRECTION DÉFINITIVE : On vérifie que la réponse a le bon format
        // et on retourne UNIQUEMENT l'objet qui nous intéresse.
        if (response.data && response.data.data) {
            return response.data.data
        } else {
            throw new Error("Le format de la réponse de l'API est incorrect.")
        }
    } catch (error) {
        console.error("Error fetching material details:", error)
        throw error
    }
}

const fetchLocations = async () => {
    try {
        const response = await api.get("/api/patrimoine/locations")
        return response.data
    } catch (error) {
        console.error("Error fetching locations:", error)
        throw error
    }
}

const fetchEmployees = async () => {
    try {
        const response = await api.get("/api/patrimoine/employees")
        return response.data
    } catch (error) {
        console.error("Error fetching employees:", error)
        throw error
    }
}

const fetchDepartments = async () => {
    try {
        const response = await api.get("/api/patrimoine/departments")
        return response.data
    } catch (error) {
        console.error("Error fetching departments:", error)
        throw error
    }
}

const fetchFournisseurs = async () => {
    try {
        const response = await api.get("/api/patrimoine/fournisseurs")
        return response.data
    } catch (error) {
        console.error("Error fetching fournisseur:", error)
        throw error
    }
}

const fetchStats = async () => {
    try {
        const response = await api.get("/api/patrimoine/stats")
        return response.data
    } catch (error) {
        console.error("Error fetching global stats:", error)
        throw error
    }
}

const fetchTypesGeneraux = async () => {
    try {
        const response = await api.get("/api/patrimoine/categories")
        return response.data
    } catch (error) {
        console.error("Error fetching general asset types:", error)
        throw error
    }
}

const fetchSubcategories = async categoryId => {
    try {
        const response = await api.get(
            `/api/patrimoine/subcategories/${categoryId}`
        )

        // CORRECTION DÉFINITIVE :
        // Votre API renvoie maintenant le format correct : { status: 'success', data: [...] }
        // Nous nous adaptons à ce format stable.
        if (response.data && Array.isArray(response.data.data)) {
            // On retourne le tableau qui se trouve DANS la clé "data".
            return response.data.data
        } else {
            // Sécurité au cas où la réponse serait mal formée.
            console.error(
                "Format de réponse inattendu pour les sous-catégories:",
                response.data
            )
            throw new Error(
                "La réponse de l'API pour les sous-catégories est mal formée."
            )
        }
    } catch (error) {
        console.error(
            `Erreur lors de la récupération des sous-catégories pour l'ID ${categoryId} :`,
            error
        )
        throw error
    }
}

const fetchCustomFields = async subcategoryId => {
    try {
        const response = await api.get(
            `/api/patrimoine/subcategories/${subcategoryId}/fields`
        )
        return response.data
    } catch (error) {
        console.error(
            "Error fetching custom fields for subcategory ID",
            subcategoryId,
            ":",
            error
        )
        throw error
    }
}

// --- Fonctions d'opérations sur les Matériels / Mouvements ---

const createItem = async formData => {
    try {
        const response = await api.post("/api/patrimoine/assets", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return response.data
    } catch (error) {
        console.error("Error creating item:", error)
        throw new Error(
            error.response?.data?.message ||
                error.message ||
                "Erreur inconnue lors de la création"
        )
    }
}

const updateItem = async (id, formData) => {
    try {
        const response = await api.put(
            `/api/patrimoine/assets/${id}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        )
        return response.data
    } catch (error) {
        console.error(`Error updating item ${id}:`, error)
        throw new Error(
            error.response?.data?.message ||
                error.message ||
                "Erreur inconnue lors de la mise à jour"
        )
    }
}

const validerMouvement = async mouvementId => {
    try {
        const response = await api.post(
            `/api/patrimoine/mouvements/${mouvementId}/validate`,
            {}
        )
        return response.data
    } catch (error) {
        console.error("Error validating mouvement:", error)
        throw error
    }
}

const saveMouvement = async mouvementData => {
    try {
        // La vérification de session ici est inutile, l'intercepteur Axios s'en charge déjà.
        const requiredFields = ["asset_id", "type_mouvement", "date", "motif"]
        const missingFields = requiredFields.filter(
            field => !mouvementData[field]
        )

        if (missingFields.length > 0) {
            throw new Error(
                `Champs obligatoires manquants: ${missingFields.join(", ")}`
            )
        }

        const response = await api.post(
            "/api/patrimoine/mouvements",
            mouvementData
        )
        return response.data
    } catch (error) {
        console.error("Error saving mouvement:", {
            error: error.message,
            stack: error.stack,
            requestData: mouvementData,
        })
        throw error
    }
}

const printFicheViePdf = async assetId => {
    try {
        const response = await api.get(
            `/api/patrimoine/assets/${assetId}/print_fiche_vie`,
            {
                responseType: "blob",
            }
        )
        const blob = new Blob([response.data], { type: "application/pdf" })
        const url = window.URL.createObjectURL(blob)
        window.open(url, "_blank")
        window.URL.revokeObjectURL(url)
        return { status: "success" }
    } catch (error) {
        console.error("Error printing fiche vie PDF:", error)
        throw error
    }
}

const getMaterialsByCategory = async (generalType, subcategoryCode) => {
    let url
    if (subcategoryCode) {
        url = `/api/patrimoine/assets/category/${subcategoryCode}`
    } else if (generalType) {
        url = `/api/patrimoine/assets/type/${generalType}`
    } else {
        url = "/api/patrimoine/assets"
    }
    const response = await api.get(url)
    return response.data
}

const getCategoryItems = (generalType, subcategoryCode) => {
    return getMaterialsByCategory(generalType, subcategoryCode)
}

const getCategoryStats = async (generalType, subcategoryCode) => {
    let url
    if (subcategoryCode) {
        url = `/api/patrimoine/stats/category/${subcategoryCode}`
    } else if (generalType) {
        url = `/api/patrimoine/stats/type/${generalType}`
    } else {
        url = "/api/patrimoine/stats"
    }
    const response = await api.get(url)
    return response.data
}

// --- Fonctions pour les demandes de matériel ---

const fetchDemandes = async () => {
    try {
        const response = await api.get("/api/patrimoine/demandes")
        return response.data
    } catch (error) {
        console.error("Error fetching demandes:", error)
        throw error
    }
}

const fetchDemandeDetails = async demandeId => {
    try {
        const response = await api.get(
            `/api/patrimoine/demande_materiel/${demandeId}`
        )
        return {
            ...response.data,
            materiels: response.data.ligne_ids || [],
        }
    } catch (error) {
        console.error(`Error fetching details for demande ${demandeId}:`, error)
        throw error
    }
}

const processDemande = async (demandeId, action) => {
    try {
        const url =
            action === "approve"
                ? `/api/patrimoine/demandes/${demandeId}/approval`
                : `/api/patrimoine/demandes/${demandeId}/rejection`
        const response = await api.post(url, {})
        return response.data
    } catch (error) {
        console.error(`Erreur lors du traitement de la demande ${demandeId}:`, {
            error: error.message,
            stack: error.stack,
            action,
        })
        throw error
    }
}

const createDemande = async demandeData => {
    try {
        const response = await api.post("/api/patrimoine/demandes", demandeData)
        return response.data
    } catch (error) {
        console.error("Error creating demande:", error)
        throw error
    }
}

// --- Fonctions de gestion des Déclarations de Perte ---

const createPerte = async perteData => {
    try {
        const response = await api.post("/api/patrimoine/pertes", perteData)
        return response.data
    } catch (error) {
        console.error("Error creating perte:", error)
        throw error
    }
}

const fetchDeclarationsPerte = async () => {
    try {
        const response = await api.get("/api/patrimoine/pertes")
        return response.data
    } catch (error) {
        console.error("Error fetching pertes:", error)
        throw error
    }
}

const processPerte = async (perteId, action) => {
    try {
        const response = await api.post(
            `/api/patrimoine/pertes/${perteId}/process`,
            { action }
        )
        return response.data
    } catch (error) {
        console.error(
            `Erreur lors du traitement de la perte ${perteId} avec action ${action}:`,
            error
        )
        throw error
    }
}

const getMaterialsByDepartment = async departmentId => {
    try {
        const url = `/api/patrimoine/assets/department/${departmentId}`
        const response = await api.get(url)
        return response.data
    } catch (error) {
        console.error("Error fetching materials by department:", error)
        throw error
    }
}

// --- Fonctions pour les statistiques ---

// Fonction pour la page de l'ADMIN : récupère les stats de TOUS les départements
const fetchAllDepartmentStats = async () => {
    try {
        const response = await api.get("/api/patrimoine/stats/by_department");
        return response.data;
    } catch (error) {
        console.error("Error fetching all department stats:", error);
        throw error;
    }
};

// Fonction pour la page du DIRECTEUR : récupère les stats d'UN SEUL département
const fetchStatsForOneDepartment = async (departmentId) => {
    try {
        const response = await api.get(`/api/patrimoine/stats/department/${departmentId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stats for one department:", error);
        throw error;
    }
};

const fetchStatsByType = async () => {
    try {
        const response = await api.get("/api/patrimoine/stats/by_type")
        return response.data
    } catch (error) {
        console.error("Error fetching stats by type:", error)
        return []
    }
}

const fetchStatsByDetailedCategory = async () => {
    try {
        const response = await api.get(
            "/api/patrimoine/stats/by_detailed_category"
        )
        return response.data
    } catch (error) {
        console.error("Error fetching stats by detailed category:", error)
        throw error
    }
}

// Fonction pour la page de l'AGENT : récupère les stats de l'utilisateur connecté
const fetchStatsForCurrentUser = async () => {
    try {
        const response = await api.get("/api/patrimoine/stats/user");
        return response.data;
    } catch (error) {
        console.error("Error fetching stats for current user:", error);
        throw error;
    }
};

// NOUVELLE FONCTION pour la page de validation du manager
const fetchPertesForManager = async () => {
    try {
        const response = await api.get("/api/patrimoine/pertes/manager");
        return response.data;
    } catch (error) {
        console.error("Error fetching pertes for manager:", error);
        throw error;
    }
};

const fetchFilteredMaterials = async filters => {
    // On transforme l'objet de filtres en chaîne de requête URL (ex: "?status=service&type=info")
    const queryParams = new URLSearchParams(filters).toString()
    try {
        const response = await api.get(
            `/api/patrimoine/assets/filter?${queryParams}`
        )
        return response.data
    } catch (error) {
        console.error("Error fetching filtered materials:", error)
        throw error
    }
}

// NOUVELLE FONCTION pour la validation par le manager
const processPerteForManager = async (perteId, action) => {
    try {
        const response = await api.post(`/api/patrimoine/pertes/manager_process/${perteId}`, { action });
        return response.data;
    } catch (error) {
        console.error("Error processing perte for manager:", error);
        throw error;
    }
};

const fetchStatsByAge = async () => {
    try {
        const response = await api.get("/api/patrimoine/stats/by_age")
        return response.data
    } catch (error) {
        console.error("Error fetching stats by age:", error)
        throw error
    }
}

const fetchStatsByDepartmentValue = async () => {
    try {
        const response = await api.get(
            "/api/patrimoine/stats/by_department_value"
        )
        return response.data
    } catch (error) {
        console.error("Error fetching stats by department value:", error)
        throw error
    }
}

const deleteMaterial = async assetId => {
    try {
        const response = await api.delete(`/api/patrimoine/items/${assetId}`)
        return response.data
    } catch (error) {
        console.error("Error deleting material:", error)
        throw error
    }
}

export default {
    fetchMaterials,
    fetchMaterialsByUser,
    fetchMaterialDetails,
    fetchLocations,
    fetchEmployees,
    fetchDepartments,
    fetchFournisseurs,
    fetchStats,
    fetchTypesGeneraux,
    fetchSubcategories,
    fetchCustomFields,
    createItem,
    updateItem,
    validerMouvement,
    saveMouvement,
    printFicheViePdf,
    getMaterialsByCategory,
    getCategoryItems,
    getCategoryStats,
    fetchDemandes,
    fetchDemandeDetails,
    processDemande,
    createDemande,
    fetchDeclarationsPerte,
    processPerte,
    createPerte,
    fetchStatsByType,
    fetchStatsByDetailedCategory,
    getMaterialsByDepartment,
    deleteMaterial,
    fetchAllDepartmentStats,
    fetchStatsForOneDepartment,
    fetchStatsForCurrentUser,
    fetchPertesForManager,
    processPerteForManager,
    fetchFilteredMaterials,
    fetchStatsByAge,
    fetchStatsByDepartmentValue,
}

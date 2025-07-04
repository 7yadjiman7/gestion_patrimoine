import api from "./apiConfig"

// --- Fonctions de Récupération (GET) ---

const fetchMaterials = () =>
    api.get("/api/patrimoine/assets").then(res => res.data)
const fetchMaterialsByUser = () =>
    api.get("/api/patrimoine/assets/user").then(res => res.data)
// Récupère les détails d'un matériel
// L'API renvoie un objet { status, data }, on extrait donc la clé data
const fetchMaterialDetails = id =>
    api.get(`/api/patrimoine/assets/${id}`).then(res => res.data.data)
const getMaterialsByDepartment = departmentId =>
    api
        .get(`/api/patrimoine/assets/department/${departmentId}`)
        .then(res => res.data)
const fetchFilteredMaterials = filters => {
    const queryParams = new URLSearchParams(filters).toString()
    return api
        .get(`/api/patrimoine/assets/filter?${queryParams}`)
        .then(res => res.data)
}
const fetchTypesGeneraux = () =>
    api.get("/api/patrimoine/categories").then(res => res.data)
// Récupère les sous-catégories pour un type général donné
// Si aucun identifiant n'est fourni (0), toutes les sous-catégories sont renvoyées
const fetchSubcategories = filters => {
    const query = new URLSearchParams(filters).toString()
    return api
        .get(`/api/patrimoine/subcategories?${query}`)
        .then(res => res.data.data || [])
}
const fetchLocations = () =>
    api.get("/api/patrimoine/locations").then(res => res.data)
const fetchEmployees = () =>
    api.get("/api/patrimoine/employees").then(res => res.data)
const fetchDepartments = () =>
    api.get("/api/patrimoine/departments").then(res => res.data)
const fetchFournisseurs = () =>
    api.get("/api/patrimoine/fournisseurs").then(res => res.data)
const fetchDemandes = () =>
    api.get("/api/patrimoine/demandes").then(res => res.data)
const fetchDemandeDetails = demandeId =>
    api
        .get(`/api/patrimoine/demande_materiel/${demandeId}`)
        .then(res => res.data)
const fetchDeclarationsPerte = () =>
    api.get("/api/patrimoine/pertes").then(res => res.data)
const fetchPertesForManager = () =>
    api.get("/api/patrimoine/pertes/manager").then(res => res.data)

// --- Fonctions de Création et Mise à Jour (POST, PUT) ---

const createItem = formData =>
    api
        .post("/api/patrimoine/assets", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then(res => res.data)
const updateItem = (id, formData) =>
    api
        .put(`/api/patrimoine/assets/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then(res => res.data)
const saveMouvement = mouvementData =>
    api.post("/api/patrimoine/mouvements", mouvementData).then(res => res.data)
const createDemande = demandeData =>
    api.post("/api/patrimoine/demandes", demandeData).then(res => res.data)
const createPerte = perteData =>
    api
        .post("/api/patrimoine/pertes", perteData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then(res => res.data)

// --- Fonctions de Traitement de Workflow (POST) ---

const processDemande = (demandeId, action) =>
    api
        .post(`/api/patrimoine/demandes/${demandeId}/${action}`, {})
        .then(res => res.data)
const processPerte = (perteId, action) =>
    api
        .post(`/api/patrimoine/pertes/${perteId}/process`, { action })
        .then(res => res.data)
const processPerteForManager = (perteId, action) =>
    api
        .post(`/api/patrimoine/pertes/manager_process/${perteId}`, { action })
        .then(res => res.data)

// --- Fonctions pour les Statistiques ---

const fetchStats = () => api.get("/api/patrimoine/stats").then(res => res.data)
const fetchAllDepartmentStats = () =>
    api.get("/api/patrimoine/stats/by_department").then(res => res.data)
const fetchStatsForOneDepartment = id =>
    api.get(`/api/patrimoine/stats/department/${id}`).then(res => res.data)
const fetchStatsByType = () =>
    api.get("/api/patrimoine/stats/by_type").then(res => res.data)
const fetchStatsByAge = () =>
    api.get("/api/patrimoine/stats/by_age").then(res => res.data)
const fetchStatsByDepartmentValue = () =>
    api.get("/api/patrimoine/stats/by_department_value").then(res => res.data)
const getCategoryStats = (generalType, subcategoryCode) => {
    let url = "/api/patrimoine/stats"
    if (subcategoryCode)
        url = `/api/patrimoine/stats/category/${subcategoryCode}`
    else if (generalType) url = `/api/patrimoine/stats/type/${generalType}`
    return api.get(url).then(res => res.data)
}
const fetchStatsForCurrentUser = () =>
    api.get("/api/patrimoine/stats/user").then(res => res.data)

// --- Fonctions Diverses ---
const deleteMaterial = id =>
    api.delete(`/api/patrimoine/items/${id}`).then(res => res.data)
const printFicheViePdf = async assetId => {
    const response = await api.get(
        `/api/patrimoine/assets/${assetId}/print_fiche_vie`,
        { responseType: "blob" }
    )
    const blob = new Blob([response.data], { type: "application/pdf" })
    const url = window.URL.createObjectURL(blob)
    window.open(url, "_blank")
    window.URL.revokeObjectURL(url)
    return { status: "success" }
}

export default {
    fetchMaterials,
    fetchMaterialsByUser,
    fetchMaterialDetails,
    fetchLocations,
    fetchEmployees,
    fetchDepartments,
    fetchFournisseurs,
    fetchTypesGeneraux,
    fetchSubcategories,
    fetchFilteredMaterials,
    fetchDemandes,
    fetchDemandeDetails,
    fetchDeclarationsPerte,
    fetchPertesForManager,
    getMaterialsByDepartment,
    createItem,
    updateItem,
    saveMouvement,
    createDemande,
    createPerte,
    processDemande,
    processPerte,
    processPerteForManager,
    fetchStats,
    fetchAllDepartmentStats,
    fetchStatsForOneDepartment,
    fetchStatsByType,
    fetchStatsByAge,
    fetchStatsByDepartmentValue,
    getCategoryStats,
    fetchStatsForCurrentUser,
    deleteMaterial,
    printFicheViePdf,
}

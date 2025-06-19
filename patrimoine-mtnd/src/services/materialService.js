// services/materialService.js (COMPLETE AND CONSOLIDATED)
import { get, post } from './baseService'; 
import { apiConfig } from './apiConfig';   

// --- Fonctions de récupération de listes de données ---

const fetchMaterials = async () => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expired - Please login again'); }
    const response = await get(apiConfig.ENDPOINTS.ALL_ASSETS); 
    return response; 
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
};

const fetchMaterialDetails = async (id) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expired - Please login again'); }
    const response = await get(apiConfig.ENDPOINTS.ITEM_DETAILS(id)); 
    return response; 
  } catch (error) {
    console.error('Error fetching material details:', error);
    throw error;
  }
};

const fetchLocations = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.LOCATIONS);
        return response;
    } catch (error) { console.error('Error fetching locations:', error); throw error; }
};

const fetchEmployees = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.EMPLOYEES);
        return response;
    } catch (error) { console.error('Error fetching employees:', error); throw error; }
};

const fetchDepartments = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.DEPARTMENTS);
        return response;
    } catch (error) { console.error('Error fetching departments:', error); throw error; }
};

const fetchFournisseurs = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.FOURNISSEURS);
        return response;
    } catch (error) { console.error('Error fetching fournisseur:', error); throw error; }
};

const fetchStats = async () => { // Plus de paramètres ici, c'est pour le GLOBAL
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
    const url = apiConfig.ENDPOINTS.GENERAL_STATS; // <-- Utilise la route correcte sans filtre
    const response = await get(url);
    return response; // baseService.get retourne response.data
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
};

// Fonctions pour la catégorisation dynamique (pour AdminAjouterMateriel)
const fetchTypesGeneraux = async () => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
    const url = apiConfig.ENDPOINTS.CATEGORIES(); 
    const response = await get(url);
    return response.map(cat => ({ id: cat.id, name: cat.name, code: cat.code, type: cat.type }));
  } catch (error) { console.error('Error fetching general asset types:', error); throw error; }
};

const fetchSubcategories = async (categoryId) => { 
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
    const url = apiConfig.ENDPOINTS.SUBCATEGORIES(categoryId);
    const response = await get(url);
    return response;
  } catch (error) { console.error('Error fetching subcategories for category ID', categoryId, ':', error); throw error; }
};

const fetchCustomFields = async (subcategoryId) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
    const url = apiConfig.ENDPOINTS.CUSTOM_FIELDS(subcategoryId);
    const response = await get(url);
    return response;
  } catch (error) { console.error('Error fetching custom fields for subcategory ID', subcategoryId, ':', error); throw error; }
};


// --- Fonctions d'opérations sur les Matériels / Mouvements ---

const createItem = async (formData) => { 
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expirée - Veuillez vous reconnecter'); }

    const response = await fetch(apiConfig.ENDPOINTS.CREATE_ITEM, { 
      method: 'POST',
      headers: {
        'X-Openerp-Session-Id': sessionId 
      },
      credentials: 'include',
      body: formData 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur serveur lors de la création d'item:", errorText);
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur inconnue'}`);
    }
    return await response.json();
  } catch (error) { console.error('Error creating item:', error); throw error; }
};

const validerMouvement = async (mouvementId) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expirée - Veuillez vous reconnecter'); }

    const response = await fetch(apiConfig.ENDPOINTS.MOVEMENT_VALIDATE(mouvementId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Openerp-Session-Id': sessionId },
      credentials: 'include', body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la validation du mouvement');
    }
    return await response.json();
  } catch (error) { console.error('Error validating mouvement:', error); throw error; }
};

const saveMouvement = async (data) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expirée - Veuillez vous reconnecter'); }

    const response = await fetch(apiConfig.ENDPOINTS.MOVEMENT_CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Openerp-Session-Id': sessionId },
      credentials: 'include', body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la sauvegarde du mouvement');
    }
    return await response.json();
  } catch (error) { console.error('Error saving mouvement:', error); throw error; }
};

const printFicheViePdf = async (assetId) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) { throw new Error('Session expired - Please login again'); }

    const requestUrl = apiConfig.ENDPOINTS.PRINT_FICHE_VIE(assetId);
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: { 'X-Openerp-Session-Id': sessionId, 'Accept': 'application/pdf' },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status} lors de la génération du PDF: ${errorText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob); window.open(url, '_blank'); window.URL.revokeObjectURL(url);
    return { status: 'success' };
  } catch (error) { console.error('Error printing fiche vie PDF:', error); throw error; }
};


// Fonctions pour les items par catégorie (utilisées par CategoryItemsPage)
// C'est cette fonction qui doit appeler la NOUVELLE ROUTE Odoo avec les paramètres dans le chemin.
const getMaterialsByCategory = (generalType, subcategoryCode) => { 
  let url;
  if (subcategoryCode) {
      url = apiConfig.ENDPOINTS.ASSETS_BY_SUBCATEGORY(subcategoryCode); // Cible /api/patrimoine/assets/category/<code_subcat>
  } else if (generalType) {
      url = apiConfig.ENDPOINTS.ASSETS_BY_TYPE(generalType); // Cible /api/patrimoine/assets/type/<type_general>
  } else {
      url = apiConfig.ENDPOINTS.ALL_ASSETS; // Cible /api/patrimoine/assets (pour tout lister si aucun filtre)
  }

  console.log(`Fetching materials (final URL): ${url}`);
  return get(url); 
};

const getCategoryItems = (generalType, subcategoryCode) => { // Alias de getMaterialsByCategory
  return getMaterialsByCategory(generalType, subcategoryCode);
};

// La fonction getCategoryStats doit aussi utiliser les nouvelles routes par path variable
const getCategoryStats = (generalType, subcategoryCode) => { 
  let url;
  if (subcategoryCode) {
      url = apiConfig.ENDPOINTS.STATS_BY_SUBCATEGORY(subcategoryCode); // Cible /api/patrimoine/stats/category/<code_subcat>
  } else if (generalType) {
      url = `/api/patrimoine/stats/type/${generalType}`; // Cible /api/patrimoine/stats/type/<type_general>
  } else {
      url = apiConfig.ENDPOINTS.GENERAL_STATS; // Cible /api/patrimoine/stats (pour les stats globales)
  }
  
  console.log(`Fetching stats (final URL): ${url}`);
  return get(url); 
};

// Pour lister toutes les demandes
const fetchDemandes = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.DEMANDES_LIST); 
        return response; 
    } catch (error) {
        console.error('Error fetching demandes:', error);
        throw error;
    }
};

// Pour approuver ou rejeter une demande
const processDemande = async (demandeId, action) => { // action: 'approve' ou 'reject'
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await post(apiConfig.ENDPOINTS.DEMANDES_PROCESS(demandeId), { action }); // Envoie l'action dans le body
        return response; 
    } catch (error) {
        console.error(`Error processing demande ${demandeId} with action ${action}:`, error);
        throw error;
    }
};

// Pour qu'un directeur puisse créer une demande
const createDemande = async (demandeData) => { // demandeData contiendra les nouveaux champs
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');

        // Note: Le contrôleur Odoo pour create_demande est de type='json'
        // Donc, nous envoyons un objet JSON
        const response = await post(apiConfig.ENDPOINTS.DEMANDES_CREATE, demandeData); 
        return response; 
    } catch (error) {
        console.error('Error creating demande:', error);
        throw error;
    }
};

// --- Fonctions de gestion des Déclarations de Perte ---

// --- Fonction de création d'une Déclaration de Perte ---
const createPerte = async (perteData) => { // perteData contiendra asset_id et motif
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');

        const response = await post(apiConfig.ENDPOINTS.PERTES_CREATE, perteData); // Nouvelle constante d'endpoint
        return response; // {status: 'success', perte_id: X, perte_name: 'PERTE/2025/0001'}
    } catch (error) {
        console.error('Error creating perte:', error);
        throw error;
    }
};

// Pour lister toutes les déclarations de perte
const fetchDeclarationsPerte = async () => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await get(apiConfig.ENDPOINTS.PERTES_LIST); // Nouvelle constante d'endpoint
        return response; // Tableau de déclarations
    } catch (error) {
        console.error('Error fetching pertes:', error);
        throw error;
    }
};

// Pour confirmer ou rejeter une déclaration de perte
const processPerte = async (perteId, action) => { // action: 'confirm' ou 'reject'
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée - Veuillez vous reconnecter');
        const response = await post(apiConfig.ENDPOINTS.PERTES_PROCESS(perteId), { action }); // Envoie l'action dans le body
        return response; // {status: 'success', new_state: 'confirmed'|'rejected'}
    } catch (error) {
        console.error(`Erreur lors du traitement de la perte ${perteId} avec action ${action}:`, error);
        throw error;
    }
};


// --- NOUVELLE FONCTION : Obtenir les matériels par département ---
const getMaterialsByDepartment = async (departmentId) => {
    try {
        const sessionId = localStorage.getItem('odoo_session_id');
        if (!sessionId) throw new Error('Session expirée');
        // Appel de la nouvelle API
        const url = `/api/patrimoine/assets/department/${departmentId}`; // <-- URL avec l'ID du département dans le chemin
        const response = await get(url);
        return response; // Tableau de matériels
    } catch (error) {
        console.error('Error fetching materials by department:', error);
        throw error;
    }
};


const fetchStatsByDepartment = async (departmentId) => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id');
    if (!sessionId) throw new Error('Session expirée');
    const url = departmentId
      ? apiConfig.ENDPOINTS.STATS_FOR_DEPARTMENT(departmentId)
      : apiConfig.ENDPOINTS.STATS_BY_DEPARTMENT;
    const response = await get(url);
    return response;
  } catch (error) {
    console.error('Error fetching stats by department:', error);
    throw error;
  }
};

const fetchStatsByType = async () => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée');
    const response = await get(apiConfig.ENDPOINTS.STATS_BY_TYPE);
    return response;
  } catch (error) { console.error('Error fetching stats by type:', error); throw error; }
};

const fetchStatsByDetailedCategory = async () => {
  try {
    const sessionId = localStorage.getItem('odoo_session_id'); if (!sessionId) throw new Error('Session expirée');
    const response = await get(apiConfig.ENDPOINTS.STATS_BY_DETAILED_CATEGORY);
    return response;
  } catch (error) { console.error('Error fetching stats by detailed category:', error); throw error; }
};


// --- EXPORT DE L'OBJET PAR DÉFAUT QUI CONTIENT TOUTES LES FONCTIONS ---
export default {
  fetchMaterials,
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
  validerMouvement,
  saveMouvement,
  printFicheViePdf,
  getMaterialsByCategory, 
  getCategoryItems, 
  getCategoryStats, 
  fetchDemandes,
  processDemande,
  createDemande,
  fetchDeclarationsPerte,
  processPerte,
  createPerte,
  fetchStatsByDepartment, 
  fetchStatsByType,       
  fetchStatsByDetailedCategory, 
  getMaterialsByDepartment
};
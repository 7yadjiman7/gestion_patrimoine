// services/baseService.js
import api from './apiConfig'; // L'instance Axios configurée

const handleRequest = async (method, endpoint, data = null) => {
  console.log(`Starting ${method.toUpperCase()} request to ${endpoint}`);
  try {
    const config = {
      url: endpoint, // Endpoint relatif ou absolu
      method: method.toLowerCase(),
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` // <-- SUPPRIMEZ CETTE LIGNE
        // Le header 'X-Openerp-Session-Id' est géré par les appels fetch direct, ou par withCredentials:true pour axios.
        // Si Odoo requiert explicitement cet en-tête avec Axios, ajoutez-le ici:
        // 'X-Openerp-Session-Id': localStorage.getItem('odoo_session_id') || '',
      },
    };
    
    // Ajoutez 'X-Openerp-Session-Id' si l'API Odoo en a besoin pour Axios, en plus des cookies.
    // Votre code précédent le mettait manuellement pour fetch, pas pour axios.
    // S'il faut l'ajouter pour Axios, faites-le ici:
    const sessionId = localStorage.getItem('odoo_session_id');
    if (sessionId) {
        config.headers['X-Openerp-Session-Id'] = sessionId;
    }


    if (data) {
      console.log('Request data:', data);
      config.data = data;
    }

    console.log('Request config:', config);
    const response = await api(config); // L'instance 'api' (axios.create) est utilisée ici
    
    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      data: response.data
    });
    
    return response.data; // Retourne directement les données de la réponse Axios
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response?.data
    });
    
    if (error.response) {
      // Gérer les codes d'erreur HTTP spécifiques pour la redirection de session
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn('Unauthorized or Forbidden - redirecting to login');
        localStorage.removeItem('odoo_session_id');
        localStorage.removeItem('odoo_user');
        window.location.href = '/login';
      }
    }
    
    throw { // Relance l'erreur formatée
      ...error,
      isAxiosError: true,
      endpoint,
      method,
      timestamp: new Date().toISOString()
    };
  }
};

export const get = (endpoint) => handleRequest('GET', endpoint);
export const post = (endpoint, data) => handleRequest('POST', endpoint, data);
export const put = (endpoint, data) => handleRequest('PUT', endpoint, data);
export const del = (endpoint) => handleRequest('DELETE', endpoint);
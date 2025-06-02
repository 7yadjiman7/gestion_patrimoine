export const ODOO_CONFIG = {
  BASE_URL: 'http://localhost:8069', // URL de base d'Odoo via Nginx
  API_PATH: '/api',
  ENDPOINTS: {
    AUTH: '/auth',
    SESSION_AUTH: '/web/session/authenticate',
    WEBSOCKET: '/websocket',
    ASSETS: '/patrimoine/assets',
    VEHICLES: '/patrimoine/vehicles',
    IT_EQUIPMENT: '/patrimoine/it',
    FURNITURE: '/patrimoine/furniture',
    MOVEMENTS: '/patrimoine/movements',
    MAINTENANCE: '/patrimoine/maintenance'
  },
  WEBSOCKET_CONFIG: {
    RECONNECT_INTERVAL: 5000,
    TIMEOUT: 30000
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
};

// C'est la version CORRECTE de la fonction buildOdooUrl
export const buildOdooUrl = (endpoint: string) => {
  // Si l'endpoint commence par '/web' (comme /web/session/authenticate),
  // nous n'ajoutons PAS le préfixe API_PATH.
  if (endpoint.startsWith('/web')) {
    return `${ODOO_CONFIG.BASE_URL}${endpoint}`; // Utilisation correcte des template literals
  }
  // Pour vos routes d'API personnalisées (ex: /patrimoine/assets), on ajoute API_PATH.
  return `${ODOO_CONFIG.BASE_URL}${ODOO_CONFIG.API_PATH}${endpoint}`; // Utilisation correcte des template literals
};

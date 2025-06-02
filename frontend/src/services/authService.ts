import axios from 'axios';
import { buildOdooUrl, ODOO_CONFIG } from '../config/odoo.config';

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'director' | 'agent';
  department?: string;
  groups: string[];
}

export const loginWithOdoo = async (username: string, password: string): Promise<User> => {
  try {
    // Cette URL doit maintenant construire http://localhost:8069/web/session/authenticate (ou via Nginx)
    const requestUrl = buildOdooUrl(ODOO_CONFIG.ENDPOINTS.SESSION_AUTH);
    console.log("Sending authentication request to:", requestUrl); // Ajoutez ce log pour vérifier
   
    // Utilisez directement l'endpoint SESSION_AUTH sans ajouter API_PATH
    console.log('Tentative de connexion à Odoo avec les identifiants:', { username, db: 'odoo17_2' });
    console.log('URL de connexion:', requestUrl);
    
    const response = await axios.post(requestUrl, {
      jsonrpc: '2.0',
      params: {
        login: username,
        password,
        db: 'odoo17_2'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true,
      xsrfCookieName: 'session_id',
      xsrfHeaderName: 'X-Openerp-Session-Id'
    });

    console.log('Réponse du serveur:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });

    if (response.data?.result?.uid) {
      if (!response.data.result.uid) {
        throw new Error('Authentication failed - no user ID returned');
      }
      
      // Vérifier que la session est bien établie
      if (!response.headers['set-cookie']) {
        throw new Error('Session cookie not received');
      }
      
      // Récupérer les groupes de l'utilisateur depuis Odoo
      const groupsResponse = await axios.post(buildOdooUrl('/web/dataset/call_kw'), {
        jsonrpc: '2.0',
        params: {
          model: 'res.users',
          method: 'read',
          args: [[response.data.result.uid], ['groups_id']],
          kwargs: {}
        }
      });

      const groups = groupsResponse.data.result[0].groups_id || [];
      
      return {
        id: response.data.result.uid,
        name: username,
        role: 'agent', // Valeur par défaut
        groups
      };
    }
    throw new Error('Authentication failed');
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    // Vérifiez si 'error' est une instance d'AxiosError avant d'accéder à ses propriétés
    if (axios.isAxiosError(error) && error.response?.data?.error?.data?.message) {
      throw new Error(error.response.data.error.data.message);
    }
    // Vous pourriez aussi vouloir vérifier d'autres types d'erreurs ici, par exemple Error
    if (error instanceof Error) {
      throw new Error(`Échec de l'authentification : ${error.message}. Veuillez vérifier vos identifiants.`);
    }
    // Pour les cas non gérés, lancez une erreur générique
    throw new Error('Échec de l\'authentification. Veuillez vérifier vos identifiants.');
  }
};

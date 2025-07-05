import api from './apiConfig'

// On récupère toutes les fonctions des deux versions

// Pour récupérer toutes les conversations
const fetchConversations = () =>
  api.get('/api/chat/conversations').then(res => res.data);

// Pour récupérer les messages d'une conversation spécifique
const fetchMessages = (conversationId) =>
  api.get(`/api/chat/conversations/${conversationId}/messages`).then(res => res.data);

// Pour envoyer un message
const sendMessage = (conversationId, content) =>
  api.post(`/api/chat/conversations/${conversationId}/messages`, { content }).then(res => res.data);

// Pour démarrer une nouvelle conversation avec un participant
const createConversation = (participants) =>
  api.post('/api/chat/conversations', { participants }).then(res => res.data);


// On exporte toutes les fonctions utiles
export default {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation, // On garde le nom le plus clair
};

import api from './apiConfig'

// On récupère toutes les fonctions des deux versions

// Pour récupérer toutes les conversations
// The API now wraps payloads inside a `data` key
const unwrap = res => (res.data && res.data.data ? res.data.data : res.data)

const fetchConversations = () =>
  api.get('/api/chat/conversations').then(unwrap)

// Pour récupérer les messages d'une conversation spécifique
const fetchMessages = conversationId =>
  api
    .get(`/api/chat/conversations/${conversationId}/messages`)
    .then(res => {
      const messages = unwrap(res) || []
      // Ensure every message carries its conversation id
      return messages.map(m => ({ conversation_id: conversationId, ...m }))
    })

// Pour envoyer un message
const sendMessage = (conversationId, content) =>
  api
    .post(`/api/chat/conversations/${conversationId}/messages`, { content })
    .then(res => ({ conversation_id: conversationId, ...unwrap(res) }))

// Pour démarrer une nouvelle conversation avec un participant
const createConversation = participants =>
  api
    .post('/api/chat/conversations', { participants })
    .then(unwrap)


// On exporte toutes les fonctions utiles
export default {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation, // On garde le nom le plus clair
};

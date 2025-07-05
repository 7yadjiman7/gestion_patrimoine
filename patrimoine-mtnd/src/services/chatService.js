import api from './apiConfig'

const fetchConversations = () =>
  api.get('/api/chat/conversations').then(res => res.data)

const fetchMessages = conversationId =>
  api.get(`/api/chat/conversations/${conversationId}/messages`).then(res => res.data)

const sendMessage = (conversationId, content) =>
  api.post(`/api/chat/conversations/${conversationId}/messages`, { content }).then(res => res.data)

const startConversation = employeeId =>
  api.post('/api/chat/conversations', { employee_id: employeeId }).then(res => res.data)

export default {
  fetchConversations,
  fetchMessages,
  sendMessage,
  startConversation,
}

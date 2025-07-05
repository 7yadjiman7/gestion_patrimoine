import api from './apiConfig'

export const createConversation = async (participants) => {
  const response = await api.post('/api/chat/conversations', { participants })
  return response.data
}

export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, { content })
  return response.data
}

export default {
  createConversation,
  sendMessage
}

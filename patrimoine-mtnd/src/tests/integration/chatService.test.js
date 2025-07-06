import api from '../../services/apiConfig'
import chatService from '../../services/chatService'

jest.mock('../../services/apiConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}))

describe('Chat Service with updated API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('createConversation unwraps response and returns conversation', async () => {
    api.post.mockResolvedValue({ data: { status: 'success', data: { id: 5, name: 'Test' } } })

    const conv = await chatService.createConversation([1, 2])

    expect(api.post).toHaveBeenCalledWith('/api/chat/conversations', { participants: [1, 2] })
    expect(conv).toEqual({ id: 5, name: 'Test' })
  })

  test('fetchMessages attaches conversation id to each message', async () => {
    api.get.mockResolvedValue({ data: { status: 'success', data: [{ id: 7, content: 'Hello' }] } })

    const messages = await chatService.fetchMessages(10)

    expect(api.get).toHaveBeenCalledWith('/api/chat/conversations/10/messages')
    expect(messages).toEqual([{ id: 7, content: 'Hello', conversation_id: 10 }])
  })

  test('sendMessage returns message with conversation id', async () => {
    api.post.mockResolvedValue({ data: { status: 'success', data: { id: 8, content: 'Hi' } } })

    const msg = await chatService.sendMessage(10, 'Hi')

    expect(api.post).toHaveBeenCalledWith('/api/chat/conversations/10/messages', { content: 'Hi' })
    expect(msg).toEqual({ id: 8, content: 'Hi', conversation_id: 10 })
  })

  test('fetchConversations propagates unauthorized errors', async () => {
    const error = { response: { status: 401 } }
    api.get.mockRejectedValue(error)

    await expect(chatService.fetchConversations()).rejects.toBe(error)
  })
})

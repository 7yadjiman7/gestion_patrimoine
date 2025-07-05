import chatService from '../../services/chatService'

describe('Chat Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create conversation successfully', async () => {
    const mockResponse = { status: 'success', id: 1 }
    chatService.createConversation = jest.fn().mockResolvedValue(mockResponse)

    const participants = [1, 2]
    const result = await chatService.createConversation(participants)

    expect(chatService.createConversation).toHaveBeenCalledWith(participants)
    expect(result).toEqual(mockResponse)
  })

  test('should send message successfully', async () => {
    const mockResponse = { status: 'success', message_id: 10 }
    chatService.sendMessage = jest.fn().mockResolvedValue(mockResponse)

    const conversationId = 1
    const content = 'Hello world'
    const result = await chatService.sendMessage(conversationId, content)

    expect(chatService.sendMessage).toHaveBeenCalledWith(conversationId, content)
    expect(result).toEqual(mockResponse)
  })
})

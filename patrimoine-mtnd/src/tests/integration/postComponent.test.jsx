import React from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM from 'react-dom/client'
import postsService from '../../services/postsService'
import Post from '../../components/posts/Post.jsx'

jest.mock('../../services/postsService', () => ({
  __esModule: true,
  default: {
    fetchComments: jest.fn(),
    addComment: jest.fn(),
    likePost: jest.fn(),
    viewPost: jest.fn()
  }
}))

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ currentUser: { id: 1 }, loading: false })
}))

describe('Post component comment box', () => {
  let container
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.removeChild(container)
    container = null
  })

  test('disables input when user already commented', async () => {
    postsService.fetchComments.mockResolvedValue([
      { id: 1, user_id: 1, content: 'hi', parent_id: null }
    ])
    postsService.viewPost.mockResolvedValue({})

    const post = { id: 1, body: 'b', like_count: 0, comment_count: 1, author: 'a', view_count: 0 }

    await act(async () => {
      ReactDOM.createRoot(container).render(<Post post={post} />)
    })
    await act(() => Promise.resolve())

    const commentButton = container.querySelectorAll('button')[1]
    await act(async () => {
      commentButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(() => Promise.resolve())

    const textarea = container.querySelector('textarea')
    expect(textarea.disabled).toBe(true)
    expect(container.textContent).toContain('Vous avez déjà commenté ce post.')
  })
})

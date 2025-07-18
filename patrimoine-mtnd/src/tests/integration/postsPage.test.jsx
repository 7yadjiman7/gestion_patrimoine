import React from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM from 'react-dom/client'
import postsService from '../../services/postsService'
import PostsPage from '../../pages/posts/PostsPage'

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ currentUser: { id: 1, role: 'admin_patrimoine' }, loading: false })
}))

jest.mock('../../services/postsService', () => ({
  __esModule: true,
  default: {
    fetchPosts: jest.fn(),
    createPost: jest.fn(),
    likePost: jest.fn(),
    addComment: jest.fn()
  }
}))

describe('PostsPage behaviour', () => {
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

  test('loads posts on mount', async () => {
    postsService.fetchPosts.mockResolvedValue([{ id: 1, title: 't', body: 'b' }])

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('t')
  })

  test('new post appears first', async () => {
    postsService.fetchPosts.mockResolvedValue([{ id: 1, title: 'old', body: 'old' }])
    postsService.createPost.mockResolvedValue({
      status: 'success',
      data: { id: 2, title: 'new', body: 'new' }
    })

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    const openButton = container.querySelector('button')

    await act(async () => {
      openButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(() => Promise.resolve())

    const titleInput = container.querySelector('input[placeholder="Titre de votre publication..."]')
    const textarea = container.querySelector('textarea')
    const button = container.querySelector('button')

    await act(async () => {
      titleInput.value = 'titre'
      titleInput.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.value = 'new'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(() => Promise.resolve())

    const firstTitle = container.querySelector('h3').textContent
    expect(firstTitle).toBe('new')
  })
})

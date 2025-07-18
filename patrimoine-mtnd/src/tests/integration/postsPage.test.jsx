import React from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import postsService from '../../services/postsService'
import PostsPage from '../../pages/posts/PostsPage'

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: jest.fn(() => ({ currentUser: { role: 'admin_patrimoine' }, loading: false }))
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
  let queryClient

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    jest.clearAllMocks()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    document.body.removeChild(container)
    container = null
  })

  test('loads posts on mount', async () => {
    postsService.fetchPosts.mockResolvedValue([{ id: 1, title: 't', body: 'b' }])

    await act(async () => {
      ReactDOM.createRoot(container).render(
        <QueryClientProvider client={queryClient}>
          <PostsPage />
        </QueryClientProvider>
      )
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('t')
  })

  test('new post appears first', async () => {
    postsService.fetchPosts
      .mockResolvedValueOnce([{ id: 1, title: 'old', body: 'old' }])
      .mockResolvedValueOnce([
        { id: 2, title: 'new', body: 'new' },
        { id: 1, title: 'old', body: 'old' }
      ])
    postsService.createPost.mockResolvedValue({
      status: 'success',
      data: { id: 2, title: 'new', body: 'new' }
    })

    await act(async () => {
      ReactDOM.createRoot(container).render(
        <QueryClientProvider client={queryClient}>
          <PostsPage />
        </QueryClientProvider>
      )
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

    const text = container.textContent
    expect(text.indexOf('new')).toBeGreaterThan(-1)
    expect(text.indexOf('new')).toBeLessThan(text.indexOf('old'))
  })

  test('shows error message on fetch failure', async () => {
    postsService.fetchPosts.mockRejectedValue(new Error('fail'))

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('Erreur')
  })

  test('displays empty state', async () => {
    postsService.fetchPosts.mockResolvedValue([])

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('Aucun post')
  })

  test('filters posts using search input', async () => {
    postsService.fetchPosts.mockResolvedValue([
      { id: 1, title: 'hello', body: 'b' },
      { id: 2, title: 'world', body: 'b' }
    ])

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    const searchInput = container.querySelector('input[placeholder="Rechercher..."]')

    await act(async () => {
      searchInput.value = 'world'
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('world')
    expect(container.textContent).not.toContain('hello')
  })

  test('refresh button reloads posts', async () => {
    postsService.fetchPosts.mockResolvedValueOnce([{ id: 1, title: 'old', body: 'b' }])
    postsService.fetchPosts.mockResolvedValueOnce([{ id: 2, title: 'new', body: 'b' }])

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('old')

    const refreshBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Rafraîchir'))
    await act(async () => {
      refreshBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(() => Promise.resolve())

    expect(container.textContent).toContain('new')
  })

  test('Faire un post button visible only for allowed roles', async () => {
    const { useAuth } = require('../../context/AuthContext')
    useAuth.mockReturnValueOnce({ currentUser: { role: 'user' }, loading: false })
    postsService.fetchPosts.mockResolvedValue([])

    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    const createBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Faire un post'))
    expect(createBtn).toBeUndefined()

    useAuth.mockReturnValueOnce({ currentUser: { role: 'admin_patrimoine' }, loading: false })
    await act(async () => {
      ReactDOM.createRoot(container).render(<PostsPage />)
    })
    await act(() => Promise.resolve())

    const createBtn2 = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Faire un post'))
    expect(createBtn2).toBeDefined()
  })
})

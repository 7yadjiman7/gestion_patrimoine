import api from '../../services/apiConfig'
import postsService from '../../services/postsService'

jest.mock('../../services/apiConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}))

describe('postsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetchPosts returns list of posts', async () => {
    api.get.mockResolvedValue({ data: { status: 'success', data: [{ id: 1 }] } })

    const posts = await postsService.fetchPosts()

    expect(api.get).toHaveBeenCalledWith('/api/intranet/posts')
    expect(posts).toEqual([{ id: 1 }])
  })

  test('fetchPosts forwards pagination params', async () => {
    api.get.mockResolvedValue({ data: { status: 'success', data: [] } })

    await postsService.fetchPosts(2, 5)

    expect(api.get).toHaveBeenCalledWith(
      '/api/intranet/posts',
      { params: { page: 2, page_size: 5 } }
    )
  })

  test('createPost sends form data', async () => {
    const fd = new FormData()
    api.post.mockResolvedValue({ data: { status: 'success', data: { id: 2 } } })

    const post = await postsService.createPost(fd)

    expect(api.post).toHaveBeenCalledWith(
      '/api/intranet/posts',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    expect(post).toEqual({ status: 'success', data: { id: 2 } })
  })

  test('likePost calls like endpoint', async () => {
    api.post.mockResolvedValue({ data: { status: 'success', data: { liked: true, like_count: 5 } } })

    const res = await postsService.likePost(3)

    expect(api.post).toHaveBeenCalledWith('/api/intranet/posts/3/likes')
    expect(res).toEqual({ status: 'success', data: { liked: true, like_count: 5 } })
  })

  test('viewPost calls view endpoint', async () => {
    api.post.mockResolvedValue({ data: { status: 'success', data: { view_count: 4 } } })

    const res = await postsService.viewPost(7)

    expect(api.post).toHaveBeenCalledWith('/api/intranet/posts/7/views')    expect(res).toEqual({ status: 'success', data: { view_count: 4 } })
  })

  test('addComment posts data with parent id', async () => {
    api.post.mockResolvedValue({ data: { status: 'success', data: { id: 10 } } })

    const res = await postsService.addComment(5, 'hi', 1)

    expect(api.post).toHaveBeenCalledWith('/api/intranet/posts/5/comments', { content: 'hi', parent_id: 1 })
    expect(res).toEqual({ status: 'success', data: { id: 10 } })
  })

  test('fetchComments retrieves list', async () => {
    api.get.mockResolvedValue({ data: { status: 'success', data: [{ id: 3 }] } })

    const res = await postsService.fetchComments(9)

    expect(api.get).toHaveBeenCalledWith('/api/intranet/posts/9/comments')
    expect(res).toEqual([{ id: 3 }])
  })

  test('deletePost calls admin delete route', async () => {
    api.get.mockResolvedValue({})

    await postsService.deletePost(12)

    expect(api.get).toHaveBeenCalledWith('/admin/posts/12/delete')
  })

  test('fetchUnreadCount returns number', async () => {
    api.get.mockResolvedValue({ data: { status: 'success', data: { count: 3 } } })

    const count = await postsService.fetchUnreadCount()

    expect(api.get).toHaveBeenCalledWith('/api/intranet/posts/unread_count')
    expect(count).toBe(3)
  })
})

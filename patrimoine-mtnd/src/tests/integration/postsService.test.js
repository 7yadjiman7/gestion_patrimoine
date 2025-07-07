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
    api.get.mockResolvedValue({ data: [{ id: 1 }] })

    const posts = await postsService.fetchPosts()

    expect(api.get).toHaveBeenCalledWith('/api/intranet/posts')
    expect(posts).toEqual([{ id: 1 }])
  })

  test('createPost sends form data', async () => {
    const fd = new FormData()
    api.post.mockResolvedValue({ data: { id: 2 } })

    const post = await postsService.createPost(fd)

    expect(api.post).toHaveBeenCalledWith(
      '/api/intranet/posts',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    expect(post).toEqual({ id: 2 })
  })

  test('likePost calls like endpoint', async () => {
    api.post.mockResolvedValue({ data: { likes: 5 } })

    const res = await postsService.likePost(3)

    expect(api.post).toHaveBeenCalledWith('/api/intranet/posts/3/like')
    expect(res).toEqual({ likes: 5 })
  })
})

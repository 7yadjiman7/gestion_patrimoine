import api from './apiConfig'

const fetchPosts = () =>
  api.get('/api/intranet/posts').then(res => res.data)

const createPost = formData =>
  api
    .post('/api/intranet/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => res.data)

const likePost = id =>
  api.post(`/api/intranet/posts/${id}/likes`).then(res => res.data)

const addComment = (id, content) =>
  api
    .post(`/api/intranet/posts/${id}/comments`, { content })
    .then(res => res.data)

export default {
  fetchPosts,
  createPost,
  likePost,
  addComment
}

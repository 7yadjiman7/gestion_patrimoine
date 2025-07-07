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
  api.post(`/api/intranet/posts/${id}/like`).then(res => res.data)

const sharePost = id =>
  api.post(`/api/intranet/posts/${id}/share`).then(res => res.data)

const addComment = (id, comment) =>
  api
    .post(`/api/intranet/posts/${id}/comments`, { comment })
    .then(res => res.data)

export default {
  fetchPosts,
  createPost,
  likePost,
  sharePost,
  addComment
}

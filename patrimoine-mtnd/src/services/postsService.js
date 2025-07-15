import api from './apiConfig'

const fetchPosts = () =>
  api.get('/api/intranet/posts').then(res => res.data.data)

// CORRECTION FINALE : On ajoute l'option des headers ici
const createPost = (formData) =>
    api.post('/api/intranet/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);

const likePost = id =>
  api.post(`/api/intranet/posts/${id}/likes`).then(res => res.data)

const viewPost = id =>
  api.post(`/api/intranet/posts/${id}/views`).then(res => res.data)

const addComment = (id, content, parentId = null) => {
  console.debug('addComment payload', { id, content, parent_id: parentId })
  return api
    .post(`/api/intranet/posts/${id}/comments`, { content, parent_id: parentId })
    .then(res => res.data)
}

const fetchComments = id =>
  api.get(`/api/intranet/posts/${id}/comments`).then(res => res.data.data)

const deletePost = id =>
  api.get(`/admin/posts/${id}/delete`)

export default {
  fetchPosts,
  createPost,
  likePost,
  addComment,
  viewPost,
  fetchComments,
  deletePost
}

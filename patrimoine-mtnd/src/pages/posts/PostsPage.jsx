import React, { useEffect, useState } from 'react'
import postsService from '../../services/postsService'
import CreatePost from '../../components/posts/CreatePost'
import PostsList from '../../components/posts/PostsList'

export default function PostsPage() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    postsService.fetchPosts().then(setPosts).catch(() => {})
  }, [])

  const addPost = post => setPosts(prev => [post, ...prev])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mur de posts</h1>
      <CreatePost onCreated={addPost} />
      <PostsList posts={posts} />
    </div>
  )
}

import React from 'react'
import Post from './Post'

export default function PostsList({ posts }) {
  return (
    <div>
      {posts.map(p => (
        <Post key={p.id} post={p} />
      ))}
    </div>
  )
}

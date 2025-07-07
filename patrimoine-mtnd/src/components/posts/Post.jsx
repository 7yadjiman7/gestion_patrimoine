import React, { useState } from 'react'
import postsService from '../../services/postsService'

export default function Post({ post }) {
  const [likes, setLikes] = useState(post.like_count || 0)
  const [comments, setComments] = useState(post.comments || [])
  const [text, setText] = useState('')

  const handleLike = async () => {
    try {
      await postsService.likePost(post.id)
      setLikes(likes + 1)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = async () => {
    try {
      await postsService.sharePost(post.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleComment = async () => {
    if (!text.trim()) return
    try {
      const c = await postsService.addComment(post.id, text)
      setComments([...comments, { ...c, comment: text }])
      setText('')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-gray-900 p-4 rounded mb-4">
      <h3 className="font-semibold mb-2">{post.title}</h3>
      <p className="mb-2 whitespace-pre-wrap">{post.body}</p>
      {post.image && (
        <img
          src={post.image}
          alt=""
          className="mb-2 max-h-60 object-cover w-full rounded"
        />
      )}
      <div className="flex space-x-4 mb-2 text-sm">
        <button onClick={handleLike} className="text-blue-400">
          J'aime ({likes})
        </button>
        <button onClick={handleShare} className="text-blue-400">Partager</button>
      </div>
      <div className="space-y-2">
        {comments.map((c, idx) => (
          <p key={idx} className="text-sm">
            {c.author_name ? (
              <span className="font-semibold">{c.author_name}: </span>
            ) : null}
            {c.body || c.comment}
          </p>
        ))}
      </div>
      <div className="mt-2 flex">
        <input
          className="flex-1 bg-gray-800 p-2 rounded mr-2"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Commenter..."
        />
        <button
          onClick={handleComment}
          className="bg-blue-500 text-white px-3 rounded"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}

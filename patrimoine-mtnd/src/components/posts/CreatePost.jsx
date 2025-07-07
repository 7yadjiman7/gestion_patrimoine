import React, { useState } from 'react'
import postsService from '../../services/postsService'

export default function CreatePost({ onCreated }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!text.trim() && !file) return

    const formData = new FormData()
    formData.append('body', text)
    formData.append('name', title)
    if (file) formData.append('image', file)

    setLoading(true)
    try {
      const post = await postsService.createPost(formData)
      onCreated && onCreated(post)
      setTitle('')
      setText('')
      setFile(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 bg-gray-900 p-4 rounded">
      <input
        className="w-full p-2 bg-gray-800 text-white rounded mb-2"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titre"
      />
      <textarea
        className="w-full p-2 bg-gray-800 text-white rounded mb-2"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Votre annonce..."
      />
      <input
        type="file"
        className="mb-2"
        onChange={e => setFile(e.target.files[0])}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        Publier
      </button>
    </form>
  )
}

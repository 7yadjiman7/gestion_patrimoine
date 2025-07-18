import React from "react"
import Post from "./Post"

// CORRECTION : On accepte "onPostUpdate" en plus des "posts"
export default function PostsList({ posts, onPostUpdate }) {
    return (
        <div className="space-y-8">
            {posts.map(p => (
                // On passe la fonction de mise à jour à chaque composant Post
                <Post key={p.id} post={p} onPostUpdate={onPostUpdate} />
            ))}
        </div>
    )
}

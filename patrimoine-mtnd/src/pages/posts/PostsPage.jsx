import React, { useEffect, useState, useCallback } from "react"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"

export default function PostsPage() {
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchAndSetPosts = useCallback(async () => {
        try {
            const fetchedPosts = await postsService.fetchPosts()
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
        } catch (error) {
            console.error("Failed to fetch posts", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAndSetPosts()
    }, [fetchAndSetPosts])

    const handlePostCreated = () => {
        // Simplement rafraîchir toute la liste pour voir le nouveau post en haut
        fetchAndSetPosts()
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 text-white">
                Fil d'Actualités
            </h1>
            <CreatePost onCreated={handlePostCreated} />
            {isLoading ? (
                <p className="text-center text-slate-400">
                    Chargement des posts...
                </p>
            ) : (
                <PostsList posts={posts} />
            )}
        </div>
    )
}

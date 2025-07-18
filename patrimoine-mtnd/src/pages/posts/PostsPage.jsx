import React, { useEffect, useState, useCallback } from "react"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { Inbox } from "lucide-react"
import { toast } from "react-hot-toast"

export default function PostsPage() {
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [error, setError] = useState(null)

    const fetchAndSetPosts = useCallback(async () => {
        try {
            const fetchedPosts = await postsService.fetchPosts()
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
        } catch (err) {
            console.error("Failed to fetch posts", err)
            setError("Erreur lors du chargement des posts.")
            toast.error("Impossible de récupérer les posts")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAndSetPosts()
    }, [fetchAndSetPosts])

    const updatePostInList = useCallback((postId, updatedData) => {
        setPosts(currentPosts =>
            currentPosts.map(post =>
                post.id === postId ? { ...post, ...updatedData } : post
            )
        )
    }, [])

    const handlePostCreated = () => {
        // Simplement rafraîchir toute la liste pour voir le nouveau post en haut
        fetchAndSetPosts()
        setShowCreate(false)
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 text-white">
                Fil d'Actualités
            </h1>
            {error && (
                <p className="text-red-500 text-center mb-4">{error}</p>
            )}
            {showCreate ? (
                <CreatePost onCreated={handlePostCreated} />
            ) : (
                <Button className="mb-4" onClick={() => setShowCreate(true)}>
                    Faire un post
                </Button>
            )}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : (
                // On passe la nouvelle fonction aux enfants
                <PostsList posts={posts} onPostUpdate={updatePostInList} />
            )}
        </div>
    )
}

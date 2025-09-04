import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import postsService from "@/services/postsService" // Adaptez le chemin si nécessaire
import PostsList from "@/components/posts/PostsList" // Adaptez le chemin
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"

export default function MyPostsPage() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()

    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // La logique de fetch est spécialisée pour ne récupérer que les posts de l'utilisateur
    const fetchMyPosts = useCallback(async () => {
        if (!currentUser) return // Sécurité au cas où l'utilisateur n'est pas encore chargé

        setIsLoading(true)
        try {
            // **APPEL API CLÉ** : On passe l'ID de l'utilisateur au service
            const fetchedPosts = await postsService.fetchPosts(undefined, undefined, currentUser.id)
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
        } catch (error) {
            console.error("Failed to fetch user posts", error)
            toast.error("Erreur lors du chargement de vos posts.")
        } finally {
            setIsLoading(false)
        }
    }, [currentUser]) // On dépend de currentUser pour avoir l'ID

    useEffect(() => {
        fetchMyPosts()
    }, [fetchMyPosts])

    // Fonction pour mettre à jour la liste localement après un like/commentaire
    const updatePostInList = useCallback((id, data) => {
        setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)))
    }, [])

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Mes Publications
                </h1>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Retour
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : posts.length > 0 ? (
                <PostsList posts={posts} onPostUpdate={updatePostInList} />
            ) : (
                <p className="text-center text-gray-400">
                    Vous n'avez encore rien publié.
                </p>
            )}
        </div>
    )
}
import React, { useEffect, useState, useCallback } from "react"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"

export default function PostsPage() {
    const { currentUser } = useAuth()
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [search, setSearch] = useState("")
    const [error, setError] = useState(null)

    const fetchAndSetPosts = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const fetchedPosts = await postsService.fetchPosts()
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
        } catch (error) {
            console.error("Failed to fetch posts", error)
            setError("Erreur de chargement des posts")
            toast.error("Erreur lors du chargement des posts.")
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
        setShowCreate(false)
    }

    const filteredPosts = posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.body?.toLowerCase().includes(search.toLowerCase())
    )

    const canPost = currentUser && currentUser.role !== 'user'

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 text-white">
                Fil d'Actualités
            </h1>
            <div className="flex items-center gap-2 mb-4">
                <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Button variant="outline" onClick={fetchAndSetPosts}>
                    Rafraîchir
                </Button>
            </div>
            {showCreate ? (
                <CreatePost onCreated={handlePostCreated} />
            ) : (
                canPost && (
                    <Button className="mb-4" onClick={() => setShowCreate(true)}>
                        Faire un post
                    </Button>
                )
            )}
            {isLoading ? (
                <p className="text-center text-slate-400">Chargement des posts...</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : filteredPosts.length > 0 ? (
                <PostsList posts={filteredPosts} />
            ) : (
                <p className="text-center text-slate-400">Aucun post trouvé.</p>
            )}
        </div>
    )
}

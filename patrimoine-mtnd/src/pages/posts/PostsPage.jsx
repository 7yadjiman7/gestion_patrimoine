import React, { useEffect, useState, useCallback, useMemo } from "react"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Pagination removed as navigation buttons duplicated refresh
import { Spinner } from "@/components/ui/spinner"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"

export default function PostsPage() {
    const { currentUser } = useAuth()
    const canCreate = ["admin_patrimoine", "admin", "agent"].includes(
        currentUser?.role
    )
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const PAGE_SIZE = 10
    const [search, setSearch] = useState("")
    const [error, setError] = useState(null)

    const fetchAndSetPosts = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const fetchedPosts = await postsService.fetchPosts(undefined, PAGE_SIZE)
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
        fetchAndSetPosts()
        setShowCreate(false)
    }

    const updatePostInList = useCallback((id, data) => {
        setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)))
    }, [])

    const filteredPosts = useMemo(() => {
        if (!search) return posts
        const q = search.toLowerCase()
        return posts.filter(p => {
            const titleMatch = (p.title || p.name || "").toLowerCase().includes(q)
            const authorMatch = (p.author || "").toLowerCase().includes(q)
            const dateString = p.create_date
                ? new Date(p.create_date).toLocaleDateString("fr-FR").toLowerCase()
                : ""
            const dateMatch = dateString.includes(q)
            return titleMatch || authorMatch || dateMatch
        })
    }, [posts, search])

    const canPost = currentUser && currentUser.role !== 'user'

    const handleRefresh = async () => {
        await fetchAndSetPosts()
        toast.success("Posts mis à jour")
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Fil d'Actualités</h1>
                <Button onClick={handleRefresh}>Rafraîchir</Button>
            </div>
            <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="mb-4"
            />
            {showCreate ? (
                <CreatePost
                    onCreated={handlePostCreated}
                    onClose={() => setShowCreate(false)}
                />
            ) : (
                canPost && (
                    <Button className="mb-4" onClick={() => setShowCreate(true)}>
                        Faire un post
                    </Button>
                )
            )}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : (
                <PostsList
                    posts={filteredPosts}
                    onPostUpdate={updatePostInList}
                />
            )}
            {/* Pagination removed */}
        </div>
    )
}

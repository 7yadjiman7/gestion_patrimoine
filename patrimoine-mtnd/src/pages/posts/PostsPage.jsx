import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"
import { Button } from "@/components/ui/button"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { Inbox } from "lucide-react"
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
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")

    const fetchAndSetPosts = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const fetchedPosts = await postsService.fetchPosts(page, PAGE_SIZE)
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
         } catch (error) {
            console.error("Failed to fetch posts", error)
            setError("Erreur de chargement des posts")
            toast.error("Erreur lors du chargement des posts.")
        } finally {
            setIsLoading(false)
        }
    }, [page])

    useEffect(() => {
        fetchAndSetPosts()
    }, [fetchAndSetPosts])

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(id)
    }, [query])

    const handlePostCreated = () => {
        setShowCreate(false)
    }
    const filteredPosts = useMemo(() => {
        if (!debouncedQuery) return posts
        const q = debouncedQuery.toLowerCase()
        return posts.filter(p =>
            ((p.title || p.name || "").toLowerCase().includes(q)) ||
            ((p.author || "").toLowerCase().includes(q))
        )
    }, [posts, debouncedQuery])

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
          <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un post..."
                className="mb-4"
            />

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
              <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : (
              <PostsList posts={filteredPosts} />
              // On passe la nouvelle fonction aux enfants
                <PostsList posts={posts} onPostUpdate={updatePostInList} />
            )}
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink
                            href="#"
                            size="default"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        >
                            Précédent
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink
                            href="#"
                            size="default"
                            onClick={() => setPage(p => p + 1)}
                        >
                            Suivant
                        </PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}

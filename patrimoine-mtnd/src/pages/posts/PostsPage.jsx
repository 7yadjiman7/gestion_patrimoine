import React, { useEffect, useState, useCallback } from "react"
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

export default function PostsPage() {
    const [posts, setPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    const fetchAndSetPosts = useCallback(async () => {
        try {
            const fetchedPosts = await postsService.fetchPosts(page, PAGE_SIZE)
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : [])
        } catch (error) {
            console.error("Failed to fetch posts", error)
        } finally {
            setIsLoading(false)
        }
    }, [page])

    useEffect(() => {
        fetchAndSetPosts()
    }, [fetchAndSetPosts])

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
            {showCreate ? (
                <CreatePost onCreated={handlePostCreated} />
            ) : (
                <Button className="mb-4" onClick={() => setShowCreate(true)}>
                    Faire un post
                </Button>
            )}
            {isLoading ? (
                <p className="text-center text-slate-400">
                    Chargement des posts...
                </p>
            ) : (
                <PostsList posts={posts} />
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

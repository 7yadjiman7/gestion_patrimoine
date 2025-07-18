import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import postsService from "../../services/postsService"
import CreatePost from "../../components/posts/CreatePost"
import PostsList from "../../components/posts/PostsList"
import { Button } from "@/components/ui/button"

export default function PostsPage() {
    const [showCreate, setShowCreate] = useState(false)

    const {
        data: posts = [],
        isLoading,
    } = useQuery(["posts"], postsService.fetchPosts)

    const handlePostCreated = () => {
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
        </div>
    )
}

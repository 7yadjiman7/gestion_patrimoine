import React, { useState } from "react"
import postsService from "../../services/postsService"
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

// Fonction pour formater la date
const formatDate = dateString => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function Post({ post }) {
    // On suppose que ces données viennent de l'API
    const [likes, setLikes] = useState(post.like_count || 0)
    const [hasLiked, setHasLiked] = useState(false) // Idéalement, l'API devrait nous dire si l'utilisateur actuel a déjà liké
    const [comments, setComments] = useState(post.comments || [])
    const [newComment, setNewComment] = useState("")

    const handleLike = async () => {
        try {
            const response = await postsService.likePost(post.id)
            setLikes(response.data.like_count)
            setHasLiked(response.data.liked)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-8">
            {/* En-tête du post */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white">
                        {post.author
                            ? post.author.charAt(0).toUpperCase()
                            : "?"}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                            {post.author || "Anonyme"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(post.create_date)}
                        </p>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Contenu du post */}
            <div className="px-4 pb-4">
                <p className="text-slate-800 dark:text-slate-300 whitespace-pre-wrap mb-4">
                    {post.body}
                </p>
                {post.image && (
                    <img
                        src={`http://localhost:8069${post.image}`}
                        alt="Image du post"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                )}
            </div>

            {/* Stats (Likes/Commentaires) */}
            <div className="px-4 py-2 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-t border-b border-slate-200 dark:border-slate-700">
                <span>{likes} J'aime</span>
                <span>{post.comment_count} Commentaires</span>
            </div>

            {/* Barre d'actions */}
            <div className="flex justify-around p-1">
                <Button
                    variant="ghost"
                    onClick={handleLike}
                    className={`w-full gap-2 font-semibold ${hasLiked ? "text-blue-600" : "text-slate-500 dark:text-slate-400"}`}
                >
                    <ThumbsUp size={18} /> J'aime
                </Button>
                <Button
                    variant="ghost"
                    className="w-full gap-2 font-semibold text-slate-500 dark:text-slate-400"
                >
                    <MessageCircle size={18} /> Commenter
                </Button>
                <Button
                    variant="ghost"
                    className="w-full gap-2 font-semibold text-slate-500 dark:text-slate-400"
                >
                    <Share2 size={18} /> Partager
                </Button>
            </div>
        </div>
    )
}

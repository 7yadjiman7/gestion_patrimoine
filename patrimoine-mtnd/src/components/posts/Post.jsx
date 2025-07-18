import React, { useState, useEffect } from "react"
import postsService from "../../services/postsService"
import { ThumbsUp, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/config/api"
import { useAuth } from "@/context/AuthContext"

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

export default function Post({ post, onPostUpdate }) {
    // On suppose que ces données viennent de l'API
    const { currentUser } = useAuth()
    const [likes, setLikes] = useState(post.like_count || 0)
    const [hasLiked, setHasLiked] = useState(post.liked || false)
    const [comments, setComments] = useState([])
    const [commentCount, setCommentCount] = useState(post.comment_count || 0)
    const [replyTo, setReplyTo] = useState(null)
    const [hasCommented, setHasCommented] = useState(false)
    const [showComment, setShowComment] = useState(false)

    useEffect(() => {
        postsService.viewPost(post.id).catch(() => {})
    }, [post.id])

    useEffect(() => {
        postsService
            .fetchComments(post.id)
            .then(data => {
                setCommentCount(Array.isArray(data) ? data.length : 0)
                setHasCommented(
                    Array.isArray(data) &&
                        data.some(
                            c => c.user_id === currentUser.id && !c.parent_id
                        )
                )
            })
            .catch(() => {})
    }, [post.id, currentUser.id])

    useEffect(() => {
        if (showComment) {
            postsService
                .fetchComments(post.id)
                .then(data => {
                    setComments(data)
                    setCommentCount(Array.isArray(data) ? data.length : 0)
                    setHasCommented(
                        Array.isArray(data) &&
                            data.some(
                                c =>
                                    c.user_id === currentUser.id && !c.parent_id
                            )
                    )
                })
                .catch(() => {})
        }
    }, [showComment, post.id, currentUser.id])
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

    // --- CORRECTION DE LA LOGIQUE D'ENVOI DE COMMENTAIRE ---
    const handleSendComment = async () => {
        if (!newComment.trim()) return
        try {
            // 1. On appelle l'API. Elle renvoie le nouveau total de commentaires.
            const response = await postsService.addComment(post.id, newComment)

            // 2. On utilise la fonction du parent pour mettre à jour l'état global
            onPostUpdate(post.id, {
                comment_count: response.data.comment_count,
            })

            // 3. On met à jour la liste des commentaires affichés localement pour un effet instantané
            setComments(prev => [
                ...prev,
                {
                    content: newComment,
                    user_name: currentUser.name,
                    create_date: new Date().toISOString(),
                    id: response.data.id, // On utilise l'ID renvoyé par l'API
                },
            ])

            // 4. On réinitialise le champ de saisie
            setNewComment("")
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
            </div>

            {/* Contenu du post */}
            <div className="px-4 pb-4">
                <p className="text-slate-800 dark:text-slate-300 whitespace-pre-wrap mb-4">
                    {post.body}
                </p>
                {post.image && (
                    <img
                        src={`${API_BASE_URL}${post.image}`}
                        alt="Image du post"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                )}
            </div>

            {/* Stats (Likes/Commentaires/Vues) */}
            <div className="px-4 py-2 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-t border-b border-slate-200 dark:border-slate-700">
                <span>{likes} J'aime</span>
                <span>{post.comment_count || 0} Commentaires</span>
                <span>{post.view_count || 0} Vues</span>
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
                    onClick={() => setShowComment(true)}
                >
                    <MessageCircle size={18} /> Commenter
                </Button>
            </div>

            {showComment && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                    onClick={() => setShowComment(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 p-4 rounded-lg w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        {hasCommented && !replyTo && (
                            <p className="text-sm text-red-500 mb-2">
                                Vous avez déjà commenté ce post.
                            </p>
                        )}
                        <Textarea
                            className="w-full mb-2 text-base border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus-visible:ring-blue-500"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={
                                replyTo
                                    ? "Votre réponse..."
                                    : "Votre commentaire..."
                            }
                            rows="3"
                            disabled={hasCommented && !replyTo}
                        />
                        <div className="flex justify-end gap-2 mb-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowComment(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSendComment}
                                disabled={hasCommented && !replyTo}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Envoyer
                            </Button>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {comments.map(c => (
                                <div
                                    key={c.id}
                                    className="border-t pt-2 text-sm"
                                >
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-800 dark:text-slate-300">
                                            {c.author || c.user_name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {formatDate(c.create_date)}
                                        </span>
                                    </div>
                                    <p className="mt-1 mb-1 text-slate-800 dark:text-slate-300">
                                        {c.content}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyTo(c.id)}
                                        className="text-xs"
                                    >
                                        Répondre
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

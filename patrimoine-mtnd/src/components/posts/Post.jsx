import React, { useState, useEffect, useCallback } from "react"
import postsService from "../../services/postsService"
import { ThumbsUp, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/config/api"
import { useAuth } from "@/context/AuthContext"
import CommentItem from "./CommentItem"
import useOdooBus from "../../hooks/useOdooBus" 

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
    const { currentUser } = useAuth()
    const [likes, setLikes] = useState(post.like_count || 0)
    const [hasLiked, setHasLiked] = useState(post.liked || false)
    const [comments, setComments] = useState([])
    const [replyTo, setReplyTo] = useState(null)
    const [hasCommented, setHasCommented] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const [newComment, setNewComment] = useState("")
    const channelName = `post_comments_${post.id}`

    const handleNewCommentNotification = useCallback(
        notification => {
            // On vérifie que la notification est bien un nouveau commentaire
            if (notification.type === "new_comment" && notification.payload) {
                const newCommentData = notification.payload
                // On ajoute le nouveau commentaire à la liste existante
                setComments(prevComments => {
                    if (prevComments.some(c => c.id === newCommentData.id)) {
                        return prevComments
                    }
                    return [...prevComments, newCommentData]
                })
                // On met à jour le compteur global
                onPostUpdate(post.id, { comment_count: post.comment_count + 1 })
            }
        },
        [post.id, post.comment_count, onPostUpdate]
    )

    // On active l'écoute des notifications pour ce post
    useOdooBus([channelName], handleNewCommentNotification)

    const fetchPostComments = useCallback(() => {
        if (showComment) {
            postsService
                .fetchComments(post.id)
                .then(data => {
                    setComments(data || [])
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

    useEffect(() => {
        fetchPostComments()
    }, [fetchPostComments])

    const handleLike = async () => {
        try {
            const response = await postsService.likePost(post.id)
            setLikes(response.data.like_count)
            setHasLiked(response.data.liked)
        } catch (e) {
            console.error(e)
        }
    }

    const handleSendComment = async () => {
        if (!newComment.trim()) return
        try {
            await postsService.addComment(post.id, newComment, replyTo)
            setNewComment("")
            setReplyTo(null)
            fetchPostComments()
            onPostUpdate(post.id, { comment_count: post.comment_count + 1 })
        } catch (e) {
            console.error(e)
        }
    }

    // --- CORRECTION CLÉ : Fonctions pour mettre à jour l'état des commentaires ---

    const handleCommentUpdated = useCallback(updatedComment => {
        const updateRecursively = commentList => {
            return commentList.map(comment => {
                if (comment.id === updatedComment.id) {
                    return { ...comment, content: updatedComment.content }
                }
                if (comment.children && comment.children.length > 0) {
                    return {
                        ...comment,
                        children: updateRecursively(comment.children),
                    }
                }
                return comment
            })
        }
        setComments(prev => updateRecursively(prev))
    }, [])

    const handleCommentDeleted = useCallback(
        deletedCommentId => {
            const filterRecursively = commentList => {
                return commentList
                    .filter(comment => comment.id !== deletedCommentId)
                    .map(comment => {
                        if (comment.children && comment.children.length > 0) {
                            return {
                                ...comment,
                                children: filterRecursively(comment.children),
                            }
                        }
                        return comment
                    })
            }
            setComments(prev => filterRecursively(prev))
            onPostUpdate(post.id, { comment_count: post.comment_count - 1 })
        },
        [post.id, post.comment_count, onPostUpdate]
    )

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

            {/* Stats */}
            <div className="px-4 py-2 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-t border-b border-slate-200 dark:border-slate-700">
                <span>{likes} J'aime</span>
                <span>{post.comment_count || 0} Commentaires</span>
                <span>{post.view_count || 0} Vues</span>
            </div>

            {/* Actions */}
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

            {/* Modale des commentaires */}
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
                            className="w-full mb-2 text-black"
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
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {comments.map(c => (
                                <CommentItem
                                    key={c.id}
                                    comment={c}
                                    onReply={setReplyTo}
                                    onCommentUpdated={handleCommentUpdated}
                                    onCommentDeleted={handleCommentDeleted}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

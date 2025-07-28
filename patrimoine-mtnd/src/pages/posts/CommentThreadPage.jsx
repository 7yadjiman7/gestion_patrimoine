import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import postsService from "../../services/postsService"
import CommentItem from "../../components/posts/CommentItem"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"

export default function CommentThreadPage() {
    const { commentId } = useParams()
    const navigate = useNavigate()

    const [parentComment, setParentComment] = useState(null)
    const [replies, setReplies] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [newReply, setNewReply] = useState("") // État pour le champ de saisie

    // Fonction pour charger et recharger les données du fil de discussion
    const loadThread = useCallback(() => {
        postsService
            .fetchCommentThread(commentId)
            .then(data => {
                setParentComment(data.parent)
                setReplies(data.replies || [])
            })
            .catch(err => {
                console.error("Failed to fetch comment thread", err)
                toast.error("Erreur lors du chargement de la discussion.")
            })
            .finally(() => setIsLoading(false))
    }, [commentId])

    useEffect(() => {
        setIsLoading(true)
        loadThread()
    }, [loadThread])

    // Fonction pour envoyer une nouvelle réponse
    const handleSendReply = async () => {
        if (!newReply.trim() || !parentComment) return

        try {
            // On utilise le post_id récupéré avec le commentaire parent
            await postsService.addComment(
                parentComment.post_id,
                newReply,
                parentComment.id
            )
            toast.success("Réponse publiée !")
            setNewReply("") // On vide le champ de saisie
            loadThread() // On rafraîchit la liste des réponses
        } catch (error) {
            console.error("Failed to send reply", error)
            toast.error("Impossible d'envoyer la réponse.")
        }
    }

    // Fonctions pour la mise à jour et la suppression (pour la réactivité)
    const handleCommentUpdated = useCallback(
        updatedComment => {
            if (parentComment && parentComment.id === updatedComment.id) {
                setParentComment(prev => ({
                    ...prev,
                    content: updatedComment.content,
                }))
            }
            setReplies(prevReplies =>
                prevReplies.map(reply =>
                    reply.id === updatedComment.id
                        ? { ...reply, content: updatedComment.content }
                        : reply
                )
            )
        },
        [parentComment]
    )

    const handleCommentDeleted = useCallback(
        deletedCommentId => {
            setReplies(prevReplies =>
                prevReplies.filter(reply => reply.id !== deletedCommentId)
            )
            if (parentComment && parentComment.id === deletedCommentId) {
                navigate(-1)
            }
        },
        [parentComment, navigate]
    )

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Spinner />
            </div>
        )
    }

    if (!parentComment) {
        return <div className="text-center py-10">Commentaire non trouvé.</div>
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <Button
                className="mb-4"
                variant="outline"
                onClick={() => navigate(-1)}
            >
                Retour
            </Button>

            {/* Commentaire Parent */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-4">
                <CommentItem
                    comment={parentComment}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                />
            </div>

            {/* Formulaire de Réponse (NOUVEAU) */}
            <div className="bg-white text-black dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                    Répondre à {parentComment.user_name}
                </h3>
                <Textarea
                    value={newReply}
                    onChange={e => setNewReply(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    className="mb-2"
                />
                <div className="flex justify-end">
                    <Button onClick={handleSendReply}>
                        Envoyer la réponse
                    </Button>
                </div>
            </div>

            {/* Liste des Réponses */}
            <h2 className="text-xl font-bold text-white mb-4">
                Réponses ({replies.length})
            </h2>
            <div className="space-y-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-4">
                {replies.length > 0 ? (
                    replies.map(reply => (
                        <div
                            key={reply.id}
                            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm"
                        >
                            <CommentItem
                                comment={reply}
                                onCommentUpdated={handleCommentUpdated}
                                onCommentDeleted={handleCommentDeleted}
                            />
                        </div>
                    ))
                ) : (
                    <p className="text-slate-400">
                        Aucune réponse pour le moment. Soyez le premier à
                        répondre !
                    </p>
                )}
            </div>
        </div>
    )
}

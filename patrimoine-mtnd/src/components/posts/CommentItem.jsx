import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import postsService from "../../services/postsService"
import { toast } from "react-hot-toast"
import { Textarea } from "@/components/ui/textarea"

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

export default function CommentItem({
    comment,
    onCommentDeleted,
    onCommentUpdated,
}) {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState(comment.content)

    const isAuthor = currentUser && currentUser.id === comment.user_id
    const replyCount = comment.children ? comment.children.length : 0

    const handleNavigateToThread = () => {
        navigate(`/posts/comment/${comment.id}`)
    }

    const handleDelete = async () => {
        if (
            window.confirm(
                "Êtes-vous sûr de vouloir supprimer ce commentaire ?"
            )
        ) {
            try {
                await postsService.deleteComment(comment.id)
                toast.success("Commentaire supprimé.")
                onCommentDeleted(comment.id)
            } catch (error) {
                toast.error("Erreur lors de la suppression.")
            }
        }
    }

    const handleUpdate = async () => {
        if (editedContent.trim() === "") return
        try {
            const updatedComment = await postsService.updateComment(
                comment.id,
                editedContent
            )
            toast.success("Commentaire modifié.")
            onCommentUpdated(updatedComment.data)
            setIsEditing(false)
        } catch (error) {
            toast.error("Erreur lors de la modification.")
        }
    }

    return (
        <div className="pt-2 text-sm border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-300">
                    {comment.user_name}
                </span>
                <span className="text-xs text-slate-500">
                    {formatDate(comment.create_date)}
                </span>
            </div>

            {isEditing ? (
                <div className="mt-2">
                    <Textarea
                        value={editedContent}
                        onChange={e => setEditedContent(e.target.value)}
                        className="mb-2 text-black"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate}>
                            Enregistrer
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditing(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="mt-1 mb-1 text-slate-800 dark:text-slate-300">
                    {comment.content}
                </p>
            )}

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNavigateToThread}
                    className="text-xs"
                >
                    Répondre {replyCount > 0 && `(${replyCount})`}
                </Button>
                {isAuthor && !isEditing && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-xs"
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="text-xs text-red-500"
                        >
                            Supprimer
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

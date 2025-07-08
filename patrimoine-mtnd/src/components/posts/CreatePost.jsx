import React, { useState } from "react"
import postsService from "../../services/postsService"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Image, Paperclip } from "lucide-react"

export default function CreatePost({ onCreated }) {
    const [text, setText] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleFileChange = e => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!text.trim() && !imageFile) {
            toast.error("Veuillez écrire un message ou ajouter une image.")
            return
        }

        const formData = new FormData()
        formData.append("body", text)
        // Le titre peut être optionnel, ou généré à partir du corps du texte côté serveur
        formData.append("name", text.substring(0, 50) || "Nouveau Post")
        if (imageFile) formData.append("image", imageFile)

        setLoading(true)
        try {
            const newPost = await postsService.createPost(formData)
            onCreated(newPost) // Rafraîchir la liste des posts
            // Réinitialiser le formulaire
            setText("")
            setImageFile(null)
            setImagePreview(null)
            toast.success("Publication créée avec succès !")
        } catch (err) {
            console.error(err)
            toast.error("Échec de la création de la publication.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSubmit}>
                <Textarea
                    className="w-full p-2 bg-transparent text-lg border-none focus:ring-0 resize-none"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Partagez quelque chose avec l'équipe..."
                    rows="3"
                />
                {imagePreview && (
                    <div className="mt-4 relative">
                        <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="rounded-lg max-h-40"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setImageFile(null)
                                setImagePreview(null)
                            }}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <label
                            htmlFor="image-upload"
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-500 cursor-pointer"
                        >
                            <Image size={20} />
                            <span>Photo</span>
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Publication..." : "Publier"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

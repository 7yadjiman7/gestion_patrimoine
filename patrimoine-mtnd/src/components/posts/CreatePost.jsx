import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import postsService from "../../services/postsService"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input" // On importe le composant Input
import { Image } from "lucide-react"

export default function CreatePost({ onCreated }) {
    // On garde les états séparés pour le titre et le texte
    const [title, setTitle] = useState("")
    const [text, setText] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)

    const queryClient = useQueryClient()
    const { mutateAsync, isPending } = useMutation({
        mutationFn: postsService.createPost,
        onSuccess: () => {
            queryClient.invalidateQueries(["posts"])
            toast.success("Publication créée avec succès !")
            onCreated?.()
        },
        onError: () => {
            toast.error("Échec de la création de la publication.")
        },
    })

    const handleFileChange = e => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        // On vérifie que le titre et le contenu (texte ou image) sont présents
        if (!title.trim()) {
            toast.error("Veuillez renseigner un titre pour votre publication.")
            return
        }
        if (!text.trim() && !imageFile) {
            toast.error("Veuillez ajouter un contenu ou une image.")
            return
        }

        const formData = new FormData()
        formData.append("name", title) // Utilise le champ 'name' attendu par le backend
        formData.append("body", text)
        if (imageFile) {
            formData.append("image", imageFile)
        }

        try {
            await mutateAsync(formData)
            // On réinitialise le formulaire
            setTitle("")
            setText("")
            setImageFile(null)
            setImagePreview(null)
            e.target.reset() // Pour vider l'input de type file
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSubmit}>
                {/* Champ pour le titre */}
                <Input
                    className="w-full p-2 text-lg font-semibold border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus-visible:ring-blue-500"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre de votre publication..."
                    required
                />
                {/* Champ pour le contenu */}
                <Textarea
                    className="w-full p-2 mt-2 text-base resize-none border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus-visible:ring-blue-500"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Partagez quelque chose avec l'équipe..."
                    rows="3"
                />
                {imagePreview && (
                    <div className="mt-4 relative w-fit">
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
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-6 w-6 flex items-center justify-center"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isPending}
                    >
                        {isPending ? "Publication..." : "Publier"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import postsService from "@/services/postsService";
import Post from "@/components/posts/Post"; // On réutilise le composant Post !
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PostDetailPage() {
    const { postId } = useParams(); // Récupère l'ID depuis l'URL
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPostDetails = async () => {
            try {
                // On a besoin d'une fonction pour récupérer un seul post.
                // Ajoutons-la dans le service.
                const fetchedPost = await postsService.fetchPostById(postId);
                setPost(fetchedPost);
            } catch (err) {
                setError("Impossible de charger ce post.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPostDetails();
    }, [postId]);

    const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce post ?")) {
            try {
                await postsService.deletePost(postId);
                toast.success("Post supprimé avec succès !");
                navigate("/admin/posts"); // Redirige vers la liste des posts
            } catch (err) {
                toast.error("La suppression a échoué.");
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement du post...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ce Post
                </Button>
            </div>

            {/* On affiche le post en réutilisant notre composant existant */}
            {post && <Post post={post} onPostUpdate={() => {}} />}
        </div>
    );
}

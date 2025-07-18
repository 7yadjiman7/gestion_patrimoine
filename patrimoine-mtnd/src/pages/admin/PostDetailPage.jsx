import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import postsService from "@/services/postsService";
import Post from "@/components/posts/Post";

export default function PostDetailPage() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        postsService
            .fetchPosts()
            .then(data => {
                const found = Array.isArray(data)
                    ? data.find(p => String(p.id) === String(id))
                    : null;
                setPost(found || null);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">Chargement...</div>;
    }

    if (!post) {
        return <div className="p-8 text-center">Post introuvable.</div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <Post post={post} />
        </div>
    );
}

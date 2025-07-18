import React, { useEffect, useState, useRef, useMemo } from "react"
import postsService from "@/services/postsService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Printer } from "lucide-react"
import { toast } from "react-hot-toast"
const ODOO_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost"


export default function AdminPostsPage() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState("")
    const tableRef = useRef()

    const loadPosts = () => {
        setLoading(true)
        postsService
            .fetchPosts()
            .then(data => setPosts(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error(err)
                setError("Erreur de chargement des posts.")
            })
            .finally(() => setLoading(false))
    }

    useEffect(loadPosts, [])

    const handleDelete = async id => {
        try {
            await postsService.deletePost(id)
            toast.success("Post supprimé")
            loadPosts()
        } catch (err) {
            console.error(err)
            toast.error("Échec de la suppression")
        }
    }

    const handlePrint = () => {
        const content = tableRef.current
        if (!content) return
        const w = window.open("", "_blank", "height=800,width=1000")
        w.document.write("<html><head><title>Liste des Posts</title>")
        Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(link => {
            w.document.head.appendChild(link.cloneNode(true))
        })
        w.document.write(`
            <style>
                body { padding: 20px; font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .no-print { display: none !important; }
            </style>
        `)
        w.document.write("</head><body>")
        w.document.write(`<div class='print-only:block'><h2>Liste des Posts</h2><p>Imprimé le ${new Date().toLocaleDateString('fr-FR')}</p></div>`)
        w.document.write(content.innerHTML)
        w.document.write("</body></html>")
        w.document.close()
        setTimeout(() => {
            w.focus()
            w.print()
            w.close()
        }, 500)
    }

    const filteredPosts = useMemo(() => {
        if (!search) return posts
        const q = search.toLowerCase()
        return posts.filter(p => {
            const titleMatch = (p.title || p.name || "").toLowerCase().includes(q)
            const authorMatch = (p.author || "").toLowerCase().includes(q)
            const dateString = p.create_date
                ? new Date(p.create_date).toLocaleDateString("fr-FR").toLowerCase()
                : ""
            const dateMatch = dateString.includes(q)
            return titleMatch || authorMatch || dateMatch
        })
    }, [posts, search])

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="min-h-screen w-full">
            <h1 className="text-5xl mb-10 text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Gestion des Posts
            </h1>
            <Button
                onClick={handlePrint}
                variant="outline"
                className="hover:bg-orange-500 hover:text-white"
            >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer le tableau
            </Button>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Input
                    placeholder="Rechercher par titre, auteur ou date"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="sm:w-1/3"
                />
            </div>
            <div ref={tableRef} className="rounded-md border mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Auteur</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right no-print">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">
                                        {p.title}
                                    </TableCell>
                                    <TableCell>{p.author}</TableCell>
                                    <TableCell>
                                        {new Date(
                                            p.create_date
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2 no-print">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={`${ODOO_BASE_URL}/web#id=${p.id}&model=intranet.post&view_type=form`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Voir
                                            </a>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            Supprimer
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan="4"
                                    className="h-24 text-center"
                                >
                                    Aucun post trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}


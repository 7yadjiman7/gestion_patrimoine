import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import categoryService from "@/services/categoryService";
import { toast } from "react-hot-toast";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: "", code: "", type: "" });
    const [editingId, setEditingId] = useState(null);
    const navigate = useNavigate();

    const loadCategories = async () => {
        try {
            const data = await categoryService.getCategories();
            const list = Array.isArray(data) ? data : data.data || [];
            setCategories(list);
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors du chargement des catégories");
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetForm = () => {
        setForm({ name: "", code: "", type: "" });
        setEditingId(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            if (editingId) {
                await categoryService.updateCategory(editingId, form);
                toast.success("Catégorie mise à jour");
            } else {
                await categoryService.createCategory(form);
                toast.success("Catégorie créée");
            }
            resetForm();
            loadCategories();
        } catch (err) {
            console.error(err);
            toast.error("Échec de l'enregistrement");
        }
    };

    const handleEdit = cat => {
        setForm({ name: cat.name, code: cat.code, type: cat.type });
        setEditingId(cat.id);
    };

    const handleDelete = async id => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        try {
            await categoryService.deleteCategory(id);
            toast.success("Catégorie supprimée");
            loadCategories();
        } catch (err) {
            console.error(err);
            toast.error("Échec de la suppression");
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold">Gestion des catégories</h1>
            <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
                <Input
                    name="name"
                    placeholder="Nom"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    name="code"
                    placeholder="Code"
                    value={form.code}
                    onChange={handleChange}
                    required
                />
                <Input
                    name="type"
                    placeholder="Type"
                    value={form.type}
                    onChange={handleChange}
                    required
                />
                <div className="flex gap-2">
                    <Button type="submit">
                        {editingId ? "Mettre à jour" : "Ajouter"}
                    </Button>
                    {editingId && (
                        <Button type="button" variant="secondary" onClick={resetForm}>
                            Annuler
                        </Button>
                    )}
                </div>
            </form>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map(cat => (
                        <TableRow key={cat.id}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell>{cat.code}</TableCell>
                            <TableCell>{cat.type}</TableCell>
                            <TableCell className="space-x-2">
                                <Button size="sm" onClick={() => handleEdit(cat)}>Éditer</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}>
                                    Supprimer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => navigate(`/admin/categories/${cat.id}/subcategories`)}
                                >
                                    Sous-catégories
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

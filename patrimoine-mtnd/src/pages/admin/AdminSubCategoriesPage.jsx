import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import categoryService from "@/services/categoryService";
import { toast } from "react-hot-toast";

export default function AdminSubCategoriesPage() {
    const { categoryId } = useParams();
    const [subcategories, setSubcategories] = useState([]);
    const [category, setCategory] = useState(null);
    const [form, setForm] = useState({ name: "", code: "" });
    const [editingId, setEditingId] = useState(null);

    const loadCategory = async () => {
        try {
            const data = await categoryService.getCategories();
            const list = Array.isArray(data) ? data : data.data || [];
            setCategory(list.find(c => String(c.id) === String(categoryId)) || null);
        } catch (err) {
            console.error(err);
        }
    };

    const loadSubcategories = async () => {
        try {
            const data = await categoryService.getSubCategories(categoryId);
            const list = Array.isArray(data) ? data : data.data || [];
            setSubcategories(list);
        } catch (err) {
            console.error(err);
            toast.error("Erreur de chargement");
        }
    };

    useEffect(() => {
        loadCategory();
        loadSubcategories();
    }, [categoryId]);

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetForm = () => {
        setForm({ name: "", code: "" });
        setEditingId(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            if (editingId) {
                await categoryService.updateSubCategory(categoryId, editingId, form);
                toast.success("Sous-catégorie mise à jour");
            } else {
                await categoryService.createSubCategory(categoryId, form);
                toast.success("Sous-catégorie ajoutée");
            }
            resetForm();
            loadSubcategories();
        } catch (err) {
            console.error(err);
            toast.error("Échec de l'enregistrement");
        }
    };

    const handleEdit = sub => {
        setForm({ name: sub.name, code: sub.code });
        setEditingId(sub.id);
    };

    const handleDelete = async id => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        try {
            await categoryService.deleteSubCategory(categoryId, id);
            toast.success("Sous-catégorie supprimée");
            loadSubcategories();
        } catch (err) {
            console.error(err);
            toast.error("Échec de la suppression");
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Sous-catégories {category ? `de ${category.name}` : ""}
                </h1>
                <Button asChild variant="secondary">
                    <Link to="/admin/categories">Retour</Link>
                </Button>
            </div>
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
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subcategories.map(sub => (
                        <TableRow key={sub.id}>
                            <TableCell>{sub.name}</TableCell>
                            <TableCell>{sub.code}</TableCell>
                            <TableCell className="space-x-2">
                                <Button size="sm" onClick={() => handleEdit(sub)}>Éditer</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(sub.id)}>
                                    Supprimer
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

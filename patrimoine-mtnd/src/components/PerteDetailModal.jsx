// src/components/PerteDetailModal.jsx

import React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/config/api"

export default function PerteDetailModal({ perte, onClose }) {
    if (!perte) return null

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0  p-6 border-b z-10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-black">
                        Détails de la Déclaration de Perte
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full text-red-500"
                    >
                        <X size={24} />
                    </Button>
                </div>

                <div className="p-6 space-y-6 text-black">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h3 className="font-semibold text-lg mb-2">
                                Informations sur le Matériel
                            </h3>
                            <p>
                                <strong>Nom :</strong> {perte.asset_name}
                            </p>
                            <p>
                                <strong>Code :</strong> {perte.asset_code}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h3 className="font-semibold text-lg mb-2">
                                Informations sur la Déclaration
                            </h3>
                            <p>
                                <strong>Déclaré par :</strong>{" "}
                                {perte.declarer_par_name}
                            </p>
                            <p>
                                <strong>Date de la perte :</strong>{" "}
                                {new Date(perte.date).toLocaleDateString()}
                            </p>
                            <p>
                                <strong>Lieu :</strong>{" "}
                                {perte.lieu_perte || "Non spécifié"}
                            </p>
                            <p>
                                <strong>Statut :</strong>{" "}
                                <Badge>{perte.state}</Badge>
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">
                            Circonstances de la perte
                        </h3>
                        <p className="p-4 bg-slate-50 rounded-lg border text-gray-800 whitespace-pre-wrap">
                            {perte.circonstances}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">
                            Actions immédiates entreprises
                        </h3>
                        <p className="p-4 bg-slate-50 rounded-lg border text-gray-800 whitespace-pre-wrap">
                            {perte.actions_entreprises ||
                                "Aucune action spécifiée."}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">
                            Déclaration à la police
                        </h3>
                        <p className="p-4 bg-slate-50 rounded-lg border text-gray-800">
                            {perte.rapport_police ? "Oui" : "Non"}
                            {perte.document_url && (
                                <a
                                    href={`${API_BASE_URL}${perte.document_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 text-blue-600 hover:underline"
                                >
                                    (Voir le document joint)
                                </a>
                            )}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <Button variant="outline" onClick={onClose} className="text-red-500">
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    )
}

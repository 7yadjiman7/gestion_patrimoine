// src/components/DemandeDetailModal.jsx

import React from "react"
import { X } from "lucide-react"

export default function DemandeDetailModal({ demande, onClose }) {
    if (!demande) return null

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            onClick={onClose} // Permet de fermer la modal en cliquant à l'extérieur
        >
            <div
                className="bg-white text-black rounded-lg shadow-xl w-full max-w-2xl p-6 relative"
                onClick={e => e.stopPropagation()} // Empêche la fermeture en cliquant à l'intérieur
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-2">
                    Détails de la Demande
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Demandeur : {demande.demandeur_name}
                </p>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h3 className="font-semibold mb-1">
                        Motif de la demande :
                    </h3>
                    <p className="text-gray-700">{demande.motif_demande}</p>
                </div>

                <h3 className="font-semibold mb-2">Articles demandés :</h3>
                <ul className="space-y-2">
                    {demande.lignes.map(ligne => (
                        <li
                            key={ligne.id}
                            className="p-3 border rounded-md bg-white"
                        >
                            <p className="font-semibold">
                                {ligne.demande_subcategory_name} (Quantité :{" "}
                                {ligne.quantite})
                            </p>
                            <p className="text-sm text-gray-600">
                                Pour :{" "}
                                {ligne.destinataire_employee_name ||
                                    ligne.destinataire_department_name ||
                                    "Non spécifié"}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

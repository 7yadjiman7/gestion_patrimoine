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
                <ul className="space-y-3">
                    {demande.lignes.map(ligne => (
                        <li
                            key={ligne.id}
                            className="p-4 border rounded-md bg-gray-50"
                        >
                            {/* Ligne principale pour le nom de l'article et la quantité */}
                            <p className="font-bold text-base">
                                {ligne.demande_subcategory_name}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Quantité : {ligne.quantite}
                            </p>

                            {/* Section détaillée pour le destinataire */}
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <h4 className="font-semibold text-sm mb-1 text-gray-800">
                                    Destinataire :
                                </h4>
                                <div className="text-sm text-gray-700 pl-4">
                                    {/* Affiche le nom de l'employé s'il existe */}
                                    {ligne.destinataire_employee_name && (
                                        <p>
                                            <span className="font-medium">
                                                Employé :
                                            </span>{" "}
                                            {ligne.destinataire_employee_name}
                                        </p>
                                    )}
                                    {/* Affiche le nom du département s'il existe */}
                                    {ligne.destinataire_department_name && (
                                        <p>
                                            <span className="font-medium">
                                                Département :
                                            </span>{" "}
                                            {ligne.destinataire_department_name}
                                        </p>
                                    )}
                                    {/* Affiche la localisation si elle existe */}
                                    {ligne.destinataire_location_name && (
                                        <p>
                                            <span className="font-medium">
                                                Localisation :
                                            </span>{" "}
                                            {ligne.destinataire_location_name}
                                        </p>
                                    )}
                                    {/* Message si aucune information de destinataire n'est fournie */}
                                    {!ligne.destinataire_employee_name &&
                                        !ligne.destinataire_department_name &&
                                        !ligne.destinataire_localisation && (
                                            <p className="text-gray-500 italic">
                                                Non spécifié
                                            </p>
                                        )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

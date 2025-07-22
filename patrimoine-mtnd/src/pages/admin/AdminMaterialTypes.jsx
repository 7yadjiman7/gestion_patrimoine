import { useNavigate, useLocation } from "react-router-dom" // <-- Ajoutez useLocation
import { useEffect } from "react" // <-- Ajoutez useEffect
import { toast } from "react-hot-toast" // <-- Assurez-vous d'avoir toast ici

export default function AdminMaterialTypes() {
    const navigate = useNavigate()
    const location = useLocation() 

    useEffect(() => {
        // On vérifie si un message de succès a été passé dans l'état de la navigation
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage)
            // On nettoie l'état pour que le message ne s'affiche pas à nouveau si on navigue en arrière
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const materialTypes = [
        {
            id: 1,
            name: "Matériels Informatiques",
            image: "/images/pc1.jpeg",
            route: "/admin/informatique",
        },
        {
            id: 2,
            name: "Matériels Mobiliers",
            image: "/images/tableBureau1.jpeg",
            route: "/admin/mobilier",
        },
        {
            id: 3,
            name: "Matériels Roulants",
            image: "/images/voiture1.jpeg",
            route: "/admin/vehicule",
        },
    ]

    return (
        <div className="min-h-screen w-full">
            <div className="text-center mb-12 mt-10">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    E-Gestion du Patrimoine matériel du MTND
                </h1>
                <p className="mt-3 text-xl text-gray-300">
                    Veuillez sélectionner un type de matériel à consulter.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-6xl mx-auto">
                {materialTypes.map(type => (
                    <div
                        key={type.id}
                        onClick={() => navigate(type.route)}
                        className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                    >
                        <img
                            src={type.image}
                            alt={type.name}
                            className="w-full h-80 object-cover brightness-110 contrast-110 saturate-125 transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-5">
                            <h2 className="text-2xl font-bold text-white drop-shadow-md">
                                {type.name}
                            </h2>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

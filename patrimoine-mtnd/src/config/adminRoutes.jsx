import { lazy } from "react"
import { AdminLayout } from "../layouts/AdminLayout"

const AdminDemandeMateriel = lazy(
    () => import("../pages/admin/AdminDemandeMateriel")
)
const AdminMaterialTypes = lazy(
    () => import("../pages/admin/AdminMaterialTypes")
)
const AdminDeclarationsPerte = lazy(
    () => import("../pages/admin/AdminDeclarationsPerte")
)
const AdminDashboardPage = lazy(
    () => import("../pages/admin/AdminDashboardPage")
)

export const adminRoutes = [
    {
        path: "dashboard",
        element: <AdminDashboardPage />,
    },
    {
        path: "demandes",
        element: <AdminDemandeMateriel />,
    },
    {
        path: "material-types",
        element: <AdminMaterialTypes />,
    },
    {
        path: "declarations-perte",
        element: <AdminDeclarationsPerte />,
    },
]

export const getAdminRoutes = () => {
    return adminRoutes.map(route => ({
        ...route,
        element: <AdminLayout>{route.element}</AdminLayout>,
    }))
}

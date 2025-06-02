import { Route, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Loading from '../components/common/Loading'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/AdminLayout'

const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })))
const PatrimoineDashboard = lazy(() => import('../pages/PatrimoineDashboard').then(m => ({ default: m.default })))
const AssetList = lazy(() => import('../pages/AssetList').then(m => ({ default: m.default })))
const AssetDetail = lazy(() => import('../pages/AssetDetail').then(m => ({ default: m.default })))
const AssetForm = lazy(() => import('../pages/AssetForm').then(m => ({ default: m.default })))
const DemandList = lazy(() => import('../pages/DemandList').then(m => ({ default: m.default })))
const LossDeclarationList = lazy(() => import('../pages/LossDeclarationList').then(m => ({ default: m.default })))

function AdminRoutes() {
  return (
    <>
      <Route index element={<PatrimoineDashboard />} />
      <Route path="materiels" element={<AssetList />} />
      <Route path="materiels/nouveau" element={<AssetForm />} />
      <Route path="materiels/:id" element={<AssetDetail />} />
      <Route path="demandes" element={<DemandList />} />
      <Route path="pertes" element={<LossDeclarationList />} />
    </>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        {user?.role === 'admin' && <Route path="/" element={<AdminLayout />}>
          <AdminRoutes />
        </Route>}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes

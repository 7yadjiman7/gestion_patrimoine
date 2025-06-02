import { Outlet } from 'react-router-dom'
import Navbar from './common/Navbar'

interface NavLink {
  path: string
  label: string
}

export default function AdminLayout() {
  const navLinks: NavLink[] = [
    { path: '/', label: 'Dashboard' },
    { path: '/materiels', label: 'Matériels' },
    { path: '/demandes', label: 'Demandes' },
    { path: '/pertes', label: 'Déclarations' }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar links={navLinks} />
      <div className="flex-1 p-4">
        <Outlet />
      </div>
    </div>
  )
}

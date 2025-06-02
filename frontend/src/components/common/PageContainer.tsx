import { Navbar } from '../layout/Navbar'
import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  children: ReactNode
}

export default function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}

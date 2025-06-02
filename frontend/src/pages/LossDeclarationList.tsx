import { useState, useEffect } from 'react'
import { getLossDeclarations, validateLossDeclaration } from '../services/assetService'
import type { LossDeclaration } from '../types/lossDeclaration'

export default function LossDeclarationList() {
  const [declarations, setDeclarations] = useState<LossDeclaration[]>([])

  useEffect(() => {
    const fetchDeclarations = async () => {
      try {
        const data = await getLossDeclarations()
        setDeclarations(data)
      } catch (error) {
        console.error('Error fetching loss declarations:', error)
      }
    }
    fetchDeclarations()
  }, [])

  const handleValidate = async (id: string) => {
    try {
      await validateLossDeclaration(id)
      setDeclarations(declarations.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error validating declaration:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Déclarations de perte</h1>
      <div className="space-y-4">
        {declarations.map(declaration => (
          <div key={declaration.id} className="border p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{declaration.asset_name}</h3>
                <p className="text-sm text-gray-600">
                  Déclaré par {declaration.user_name} le {new Date(declaration.declaration_date).toLocaleDateString()}
                </p>
                <p className="mt-2">{declaration.description}</p>
              </div>
              <button 
                onClick={() => handleValidate(declaration.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded self-start"
              >
                Valider
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

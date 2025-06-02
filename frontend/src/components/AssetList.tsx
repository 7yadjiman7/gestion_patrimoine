import { useState, useEffect } from 'react'
import { useOdoo } from '../hooks/useOdoo'
import type { AssetResponseDto } from '../types/odoo.dtos'
import Loading from './common/Loading'
import { useNavigate } from 'react-router-dom'

export const AssetList = () => {
  const [assets, setAssets] = useState<AssetResponseDto[]>([])
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { loading, error, getAssets, clearError } = useOdoo()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAssets = async () => {
      const data = await getAssets()
      setAssets(data)
    }
    fetchAssets()
  }, [getAssets])

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(filter.toLowerCase()) || 
                         asset.code.toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'all' || asset.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  if (loading) return <Loading />
  if (error) return (
    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
      {error}
      <button 
        onClick={clearError}
        className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Fermer
      </button>
    </div>
  )

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <h2 className="text-xl font-semibold">Liste des Biens Patrimoniaux</h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher..."
            className="p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          
          <select
            className="p-2 border rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="en-service">En service</option>
            <option value="hs">Hors service</option>
            <option value="maintenance">En maintenance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <div 
              key={asset.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/materiels/${asset.id}`)}
              onMouseEnter={(e) => {
                // Effet de survol amélioré
                e.currentTarget.classList.add('ring-2', 'ring-primary')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('ring-2', 'ring-primary')
              }}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg">{asset.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  asset.status.toLowerCase() === 'en-service' 
                    ? 'bg-green-100 text-green-800' 
                    : asset.status.toLowerCase() === 'hs' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {asset.status}
                </span>
              </div>
              <p className="text-gray-600 mt-2">Code: {asset.code}</p>
              <p className="text-gray-600">Valeur: {asset.current_value.toLocaleString()} €</p>
              <p className="text-gray-600">Localisation: {asset.location || 'Non spécifiée'}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            Aucun bien ne correspond aux critères de recherche
          </div>
        )}
      </div>
    </div>
  )
}

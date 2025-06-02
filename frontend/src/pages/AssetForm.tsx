import { useState } from 'react'
import { createAsset } from '../services/assetService'
import type { Asset } from '../types/asset'

export default function AssetForm() {
  const [assetData, setAssetData] = useState<Omit<Asset, 'id'>>({
    name: '',
    type: 'informatique',
    status: 'actif',
    acquisitionDate: '',
    location: '',
    category: '',
    value: 0,
    assignedTo: undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAsset(assetData)
      alert('Matériel ajouté avec succès')
      setAssetData({
        name: '',
        type: 'informatique',
        status: 'actif',
        acquisitionDate: '',
        location: '',
        category: '',
        value: 0,
        assignedTo: undefined
      })
    } catch (error) {
      console.error('Error adding asset:', error)
      alert('Erreur lors de l\'ajout du matériel')
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Ajouter un nouveau matériel</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Nom</label>
          <input
            type="text"
            value={assetData.name}
            onChange={(e) => setAssetData({...assetData, name: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-1">Type</label>
          <select
            value={assetData.type}
            onChange={(e) => setAssetData({...assetData, type: e.target.value as Asset['type']})}
            className="w-full p-2 border rounded"
            required
          >
            <option value="informatique">Informatique</option>
            <option value="mobilier">Mobilier</option>
            <option value="vehicule">Véhicule</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Statut</label>
          <select
            value={assetData.status}
            onChange={(e) => setAssetData({...assetData, status: e.target.value as Asset['status']})}
            className="w-full p-2 border rounded"
            required
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="maintenance">En maintenance</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Date d'acquisition</label>
          <input
            type="date"
            value={assetData.acquisitionDate}
            onChange={(e) => setAssetData({...assetData, acquisitionDate: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Localisation</label>
          <input
            type="text"
            value={assetData.location}
            onChange={(e) => setAssetData({...assetData, location: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Valeur</label>
          <input
            type="number"
            value={assetData.value}
            onChange={(e) => setAssetData({...assetData, value: Number(e.target.value)})}
            className="w-full p-2 border rounded"
          />
        </div>

        <button 
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enregistrer
        </button>
      </form>
    </div>
  )
}

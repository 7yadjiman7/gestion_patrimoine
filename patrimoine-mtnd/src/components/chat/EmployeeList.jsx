import React, { useEffect, useState } from 'react'
import materialService from '../../services/materialService'

export default function EmployeeList({ onSelect, onClose }) {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    materialService.fetchEmployees().then(setEmployees).catch(() => {})
  }, [])

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded p-4 w-80 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl mb-4">Choisir un employé</h2>
        <ul>
          {employees.map(emp => (
            <li
              key={emp.id}
              onClick={() => onSelect(emp)}
              className="p-2 cursor-pointer hover:bg-gray-800"
            >
              {emp.name}
            </li>
          ))}
        </ul>
        <button className="mt-4 text-sm text-gray-400" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}

export const demandeColumns = (handleApprove, handleReject) => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.original.id
  },
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ row }) => row.original.name
  },
  {
    accessorKey: 'state',
    header: 'Statut',
    cell: ({ row }) => row.original.state
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <button 
          onClick={() => handleApprove(row.original.id)}
          className="px-2 py-1 bg-green-500 text-white rounded"
        >
          Approver
        </button>
        <button
          onClick={() => handleReject(row.original.id)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Rejeter
        </button>
      </div>
    )
  }
]
import React from 'react'

export default function ConversationList({ conversations, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv)}
          className="p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800"
        >
          <p className="font-semibold">{conv.name}</p>
        </div>
      ))}
    </div>
  )
}

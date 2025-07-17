import React from 'react'

export default function ConversationList({ conversations, onSelect }) {
    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map(conversation => (
                <div
                    key={conversation.id}
                    className="p-4 cursor-pointer hover:bg-gray-700"
                >
                    <h3 className="font-semibold">
                        {/* CORRECTION : On affiche le nom, ou un texte par défaut s'il est vide */}
                        {conversation.name ||
                            `Conversation #${conversation.id}`}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                        {conversation.last_message}
                    </p>
                </div>
            ))}
        </div>
    )
}

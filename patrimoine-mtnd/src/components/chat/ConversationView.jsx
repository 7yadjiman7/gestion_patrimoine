import React from 'react'

export default function ConversationView({ messages, onSend }) {
  const [text, setText] = React.useState('')

  const handleSend = () => {
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col">
            <span className="text-sm text-blue-300 font-semibold">
              {msg.author_name}
            </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-gray-700 flex">
        <input
          className="flex-1 bg-gray-800 text-white p-2 rounded mr-2"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tapez un message..."
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSend}
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}

import React, { useEffect, useState, useCallback } from 'react'
import chatService from '../../services/chatService'
import ConversationList from '../../components/chat/ConversationList'
import ConversationView from '../../components/chat/ConversationView'
import EmployeeList from '../../components/chat/EmployeeList'
import useOdooBus from '../../hooks/useOdooBus'

export default function ChatPage() {
  const [conversations, setConversations] = useState([])
  const [current, setCurrent] = useState(null)
  const [messages, setMessages] = useState([])
  const [showEmployees, setShowEmployees] = useState(false)

  useEffect(() => {
    chatService.fetchConversations().then(setConversations).catch(() => {})
  }, [])

  const loadMessages = useCallback(id => {
    chatService.fetchMessages(id).then(setMessages).catch(() => {})
  }, [])

  useEffect(() => {
    if (current) loadMessages(current.id)
  }, [current, loadMessages])

  const handleSend = async text => {
    if (!current) return
    const msg = await chatService.sendMessage(current.id, text)
    setMessages(prev => [...prev, msg])
  }

  const handleNewMessage = busMsg => {
    if (current && busMsg.conversation_id === current.id) {
      setMessages(prev => [...prev, busMsg])
    }
  }

  useOdooBus(handleNewMessage)

  const startConversation = async emp => {
    const conv = await chatService.startConversation(emp.id)
    setConversations(prev => {
      if (prev.find(c => c.id === conv.id)) return prev
      return [...prev, conv]
    })
    setCurrent(conv)
    setShowEmployees(false)
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-gray-900 rounded-lg overflow-hidden flex shadow-lg">
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <button
            className="text-blue-400 text-sm"
            onClick={() => setShowEmployees(true)}
          >
            Nouveau
          </button>
        </div>
        <ConversationList conversations={conversations} onSelect={setCurrent} />
      </div>
      <div className="flex-1 flex flex-col">
        {current ? (
          <ConversationView messages={messages} onSend={handleSend} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sélectionnez une conversation
          </div>
        )}
      </div>
      {showEmployees && (
        <EmployeeList
          onSelect={startConversation}
          onClose={() => setShowEmployees(false)}
        />
      )}
    </div>
  )
}

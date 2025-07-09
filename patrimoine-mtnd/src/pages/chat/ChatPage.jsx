import React, { useEffect, useState, useCallback } from "react"
import chatService from "../../services/chatService"
import ConversationList from "../../components/chat/ConversationList"
import ConversationView from "../../components/chat/ConversationView"
import EmployeeList from "../../components/chat/EmployeeList"
import useOdooBus from "../../hooks/useOdooBus"
import { toast } from "react-hot-toast"

export default function ChatPage() {
    const [conversations, setConversations] = useState([])
    const [current, setCurrent] = useState(null)
    const [messages, setMessages] = useState([])
    const [showEmployees, setShowEmployees] = useState(false)

    const loadConversations = useCallback(() => {
        chatService
            .fetchConversations()
            .then(setConversations)
            .catch(() => toast.error("Erreur de chargement des conversations."))
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    const loadMessages = useCallback(id => {
        if (!id) {
            setMessages([])
            return
        }
        chatService
            .fetchMessages(id)
            .then(setMessages)
            .catch(() => {})
    }, [])

    useEffect(() => {
        loadMessages(current?.id)
    }, [current, loadMessages])

    const handleSend = async text => {
        if (!current) return
        try {
            await chatService.sendMessage(current.id, text)
            // Le message sera ajouté via le bus temps réel, pas besoin de l'ajouter manuellement ici.
        } catch (error) {
            toast.error("L'envoi du message a échoué.")
        }
    }

    const handleNewMessage = busMsg => {
        if (current && busMsg.conversation_id === current.id) {
            setMessages(prev => [...prev, busMsg])
        }
        // On rafraîchit la liste des conversations pour afficher le dernier message
        loadConversations()
    }

    // Listen for new chat messages in real time
    useOdooBus(handleNewMessage)

    const startConversation = async emp => {
        if (!emp.user_id) {
            toast.error("Cet employé n'a pas de compte utilisateur associé.")
            return
        }
        try {
            const conv = await chatService.createConversation([emp.user_id])
            if (!conversations.find(c => c.id === conv.id)) {
                setConversations(prev => [conv, ...prev])
            }
            setCurrent(conv)
            setShowEmployees(false)
        } catch (error) {
            toast.error("Impossible de démarrer la conversation.")
        }
    }

    return (
        <div className="h-[calc(100vh-5rem)] bg-gray-900 rounded-lg overflow-hidden flex shadow-lg text-white">
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <button
                        className="text-blue-400 text-sm font-medium hover:text-blue-300"
                        onClick={() => setShowEmployees(true)}
                    >
                        Nouveau
                    </button>
                </div>
                <ConversationList
                    conversations={conversations}
                    onSelect={setCurrent}
                    activeConversationId={current?.id}
                />
            </div>
            <div className="flex-1 flex flex-col">
                {current ? (
                    <ConversationView
                        messages={messages}
                        onSend={handleSend}
                        conversationName={current.name}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Sélectionnez une conversation pour commencer
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

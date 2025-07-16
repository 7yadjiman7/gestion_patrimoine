// src/pages/chat/ChatPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react"
import {
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    connectWebSocket,
    subscribeToChannels,
    setOnBusMessage,
} from "../../services/chatService"
import ConversationList from "../../components/chat/ConversationList"
import ConversationView from "../../components/chat/ConversationView"
import EmployeeList from "../../components/chat/EmployeeList"
import { toast } from "react-hot-toast"
import { useAuth } from "../../context/AuthContext"

export default function ChatPage() {
    const { currentUser } = useAuth()
    const [conversations, setConversations] = useState([])
    const [currentConversation, setCurrentConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [showEmployees, setShowEmployees] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const activeConvRef = useRef(currentConversation)

    useEffect(() => {
        activeConvRef.current = currentConversation
    }, [currentConversation])

    useEffect(() => {
        const initializeChat = async () => {
            try {
                // Étape 1: On charge les conversations via HTTP
                const initialConvs = await fetchConversations()
                setConversations(initialConvs)

                // Étape 2: On définit notre gestionnaire de messages
                setOnBusMessage(busMessage => {
                    if (
                        busMessage.type === "new_message" &&
                        busMessage.payload
                    ) {
                        const msg = busMessage.payload
                        if (
                            activeConvRef.current &&
                            msg.conversation_id === activeConvRef.current.id
                        ) {
                            setMessages(prev => [...prev, msg])
                        }
                        setConversations(prev =>
                            prev.map(c =>
                                c.id === msg.conversation_id
                                    ? {
                                          ...c,
                                          last_message: msg.content,
                                          last_date: msg.date,
                                      }
                                    : c
                            )
                        )
                    }
                })

                // --- CORRECTION ANTI-RACE CONDITION ---
                // On attend un court instant (200ms) pour être sûr que la session HTTP
                // est bien prise en compte par le serveur avant de lancer le WebSocket.
                setTimeout(() => {
                    // Étape 3: On se connecte au WebSocket
                    connectWebSocket(currentUser.id)

                    // Étape 4: On s'abonne aux canaux
                    if (initialConvs?.length > 0) {
                        const channels = initialConvs.map(
                            conv => `chat_channel_${conv.id}`
                        )
                        subscribeToChannels(channels)
                    }
                }, 200) // <-- Léger délai de 200 millisecondes
            } catch (error) {
                toast.error("Erreur lors de l'initialisation du chat.")
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeChat()
    }, [currentUser.id])

    const handleSelectConversation = useCallback(conversation => {
        if (!conversation) return
        setCurrentConversation(conversation)
        fetchMessages(conversation.id)
            .then(setMessages)
            .catch(() => setMessages([]))
    }, [])

    const handleSend = useCallback(
        async content => {
            if (!currentConversation) return
            try {
                await sendMessage(currentConversation.id, content)
                const updatedMessages = await fetchMessages(
                    currentConversation.id
                )
                setMessages(updatedMessages)
            } catch (error) {
                toast.error("L'envoi a échoué.")
            }
        },
        [currentConversation]
    )

    const startConversation = useCallback(async employee => {
        try {
            await createConversation([employee.id])
            const updatedConversations = await fetchConversations()
            setConversations(updatedConversations)
            setShowEmployees(false)
            toast.success("Conversation créée !")
        } catch (error) {
            toast.error("Impossible de démarrer la conversation.")
        }
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                Chargement...
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-5rem)] bg-gray-900 rounded-lg overflow-hidden flex shadow-lg text-white">
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
                <ConversationList
                    conversations={conversations}
                    onSelect={handleSelectConversation}
                    activeConversationId={currentConversation?.id}
                />
            </div>
            <div className="flex-1 flex flex-col">
                {currentConversation ? (
                    <ConversationView
                        messages={messages}
                        onSend={handleSend}
                        conversation={currentConversation}
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

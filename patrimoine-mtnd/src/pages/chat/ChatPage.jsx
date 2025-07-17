// src/pages/chat/ChatPage.jsx
import React, { useEffect, useState, useCallback } from "react"
import {
    fetchConversations,
    fetchMessages,
    createConversation,
} from "@/services/chatService"
import { useOdooChat } from "@/hooks/useOdooChat" // On importe notre nouveau hook
import ConversationList from "@/components/chat/ConversationList"
import ConversationView from "@/components/chat/ConversationView"
import EmployeeList from "@/components/chat/EmployeeList"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"

export default function ChatPage() {
    const [conversations, setConversations] = useState([])
    const [currentConversation, setCurrentConversation] = useState(null)
    const [showEmployees, setShowEmployees] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // On initialise les canaux à null pour le moment
    const [chatChannels, setChatChannels] = useState(null)

    // On n'active le hook que si `chatChannels` n'est pas null
    const { messages, isConnected, sendMessage, setMessages } = useOdooChat(
        chatChannels ?? []
    )

    // Ce useEffect charge les données et DÉCLENCHE l'activation du hook
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true)
            try {
                const initialConvs = await fetchConversations()

                // --- LOG 1 : Voir les données brutes de l'API ---
                console.log(
                    "Données BRUTES reçues de fetchConversations:",
                    initialConvs
                )

                // Assurons-nous que c'est bien un tableau
                if (Array.isArray(initialConvs)) {
                    setConversations(initialConvs)

                    if (initialConvs.length > 0) {
                        const channels = initialConvs.map(
                            conv => `chat_channel_${conv.id}`
                        )

                        // --- LOG 2 : Voir les canaux générés ---
                        console.log("Canaux générés pour le hook:", channels)

                        setChatChannels(channels)
                        handleSelectConversation(initialConvs[0])
                    } else {
                        console.warn(
                            "Aucune conversation initiale trouvée. Le WebSocket ne démarrera pas."
                        )
                    }
                } else {
                    console.error(
                        "Les données reçues ne sont pas un tableau ! Reçu :",
                        initialConvs
                    )
                }
            } catch (error) {
                toast.error("Erreur au chargement des conversations.")
            } finally {
                setIsLoading(false)
            }
        }
        loadInitialData()
    }, [])

    
    const handleSelectConversation = useCallback(
        async conversation => {
            if (!conversation) return
            setCurrentConversation(conversation)
            try {
                const initialMessages = await fetchMessages(conversation.id)
                setMessages(initialMessages) // On initialise les messages dans le hook
            } catch (error) {
                toast.error("Erreur au chargement des messages.")
                setMessages([])
            }
        },
        [setMessages]
    )

    const handleSend = useCallback(
        async content => {
            if (!currentConversation) return
            // On utilise la fonction sendMessage de notre hook
            await sendMessage(currentConversation.id, content)
        },
        [currentConversation, sendMessage]
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
            <div className="absolute top-2 right-2 text-xs p-1 rounded bg-gray-700">
                {isConnected ? "🟢 Connecté" : "🔴 Déconnecté"}
            </div>
        </div>
    )
}

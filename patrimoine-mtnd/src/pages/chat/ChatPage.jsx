import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import useOdooBus from "@/hooks/useOdooBus"
import {
    fetchConversations,
    fetchMessages,
    sendMessage,
} from "@/services/chatService" // Assurez-vous que le chemin est correct

// Importez vos composants de présentation
import ConversationList from "@/components/chat/ConversationList"
import ConversationView from "@/components/chat/ConversationView"
import EmployeeList from "@/components/chat/EmployeeList" // Importez EmployeeList

export default function ChatPage() {
    const navigate = useNavigate()
    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [activeConversation, setActiveConversation] = useState(null)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(false)
    const [showMyPostsOnly, setShowMyPostsOnly] = useState(false)

    // --- CHARGEMENT DES DONNÉES INITIALES ---
    const loadConversations = useCallback(async () => {
        try {
            const convs = await fetchConversations()
            setConversations(convs)
        } catch (error) {
            console.error(
                "Erreur lors de la récupération des conversations:",
                error
            )
        }
    }, [])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---

    // Appelé lorsqu'un utilisateur clique sur une conversation dans la liste
    const handleSelectConversation = useCallback(
        async conversation => {
            // Si on clique sur la même conversation, on ne fait rien
            if (activeConversation?.id === conversation.id) return

            setActiveConversation(conversation)
            setLoadingMessages(true)
            setMessages([]) // Vider les anciens messages immédiatement
            try {
                const msgs = await fetchMessages(conversation.id)
                setMessages(msgs.data) // Correction : les messages sont dans la propriété .data
            } catch (error) {
                console.error(
                    `Erreur lors de la récupération des messages pour la conv ${conversation.id}:`,
                    error
                )
            } finally {
                setLoadingMessages(false)
            }
        },
        [activeConversation]
    )

    // Appelé lorsqu'un utilisateur envoie un message depuis ConversationView
    const handleSendMessage = useCallback(
        async messageText => {
            if (!activeConversation || !messageText.trim()) return

            try {
                await sendMessage(activeConversation.id, messageText)
                // La mise à jour de l'UI se fera via la notification WebSocket
                // pour rester synchronisé avec le serveur.
            } catch (error) {
                console.error("Erreur lors de l'envoi du message:", error)
            }
        },
        [activeConversation]
    )

    // --- GESTION DES NOTIFICATIONS WEBSOCKET ---

    // Fonction de rappel pour le hook useOdooBus
    const handleNotification = useCallback(
        notification => {
            console.log("Notification WebSocket reçue:", notification)

            if (notification.type === "new_message") {
                const newMessage = notification.payload
                // On met à jour les messages SEULEMENT si la notification concerne la conversation active.
                if (
                    activeConversation &&
                    newMessage.conversation_id === activeConversation.id
                ) {
                    // MISE À JOUR IMMUABLE : on crée un nouveau tableau.
                    // C'est ce qui déclenche le re-rendu de React.
                    setMessages(prevMessages => [...prevMessages, newMessage])
                }
                // Mettre à jour la liste des conversations (pour le dernier message, etc.) peut être ajouté ici.
            }
        },
        [activeConversation]
    ) // La fonction dépend de la conversation active

    // Canaux à écouter. Par exemple, tous les canaux de chat.
    const channels = conversations.map(c => `chat_channel_${c.id}`)

    // On lance le hook WebSocket
    useOdooBus(channels, handleNotification)

    // --- RENDU DU COMPOSANT ---
    return (
        <div style={{ display: "flex", height: "90vh", position: "relative" }}>
            <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation?.id}
                onSelectConversation={handleSelectConversation}
            />
            {/* CORRECTION CLÉ : Utiliser la prop "key" force ConversationView à se réinitialiser
                complètement lorsque la conversation active change. C'est ce qui résout
                le problème du nom qui ne se met pas à jour. */}
            <ConversationView
                key={activeConversation?.id}
                conversation={activeConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={loadingMessages}
            />
            {isEmployeeListOpen && (
                <EmployeeList
                    onSelect={emp => {
                        // Logique pour créer ou trouver une conversation avec cet employé
                        console.log("Employé sélectionné:", emp)
                        setIsEmployeeListOpen(false)
                        // Vous devez implémenter la fonction createOrFindConversation
                        // createOrFindConversation(emp.user_id).then(handleSelectConversation);
                    }}
                    onClose={() => setIsEmployeeListOpen(false)}
                />
            )}
        </div>
    )
}

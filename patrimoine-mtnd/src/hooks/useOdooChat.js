// src/hooks/useOdooChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/services/apiConfig'; // Votre instance axios configurée

const ODOO_WS_URL = `ws://${window.location.hostname}/websocket`;

export function useOdooChat(initialChannels = []) {
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [channels, setChannels] = useState([])
    const socketRef = useRef(null)

    const poll = useCallback(async () => {
        try {
            await api.post("/longpolling/poll", {
                channels: channels, // On utilise les canaux passés en argument
                last: 0,
                options: {},
                is_first_poll: true,
            })
        } catch (error) {
            console.error("🔥 Erreur lors du polling Odoo :", error)
            toast.error("Erreur de synchronisation avec le serveur de chat.")
        }
    }, [channels]) // On ajoute "channels" comme dépendance

    const connect = useCallback(() => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            return
        }

        // ÉTAPE 3 du Handshake : Connexion WebSocket
        socketRef.current = new WebSocket(ODOO_WS_URL)

        socketRef.current.onopen = () => {
            console.log("✅ WebSocket connecté.")
            setIsConnected(true)
        }

        socketRef.current.onmessage = event => {
            const data = JSON.parse(event.data)
            if (Array.isArray(data)) {
                data.forEach(notification => {
                    if (
                        notification.type === "new_message" &&
                        notification.payload
                    ) {
                        // On ajoute uniquement les nouveaux messages à la liste
                        setMessages(prev => [...prev, notification.payload])
                    }
                })
            }
        }

        socketRef.current.onclose = event => {
            console.warn(
                `❗ WebSocket fermé (code=${event.code}, reason=${event.reason || "N/A"}).`
            )
            setIsConnected(false)
            // On ne tente pas de se reconnecter automatiquement pour éviter les boucles
        }

        socketRef.current.onerror = error => {
            console.error("🔥 Erreur WebSocket:", error)
            setIsConnected(false)
        }
    }, [])

    useEffect(() => {
        const setupConnection = async () => {
            // CORRECTION : Le hook s'active/réactive si les canaux existent
            if (channels.length > 0) {
                await poll()
                connect()
            }
        }

        setupConnection()

        return () => {
            if (socketRef.current) {
                console.log("🔌 Nettoyage : Déconnexion du WebSocket.")
                socketRef.current.close()
            }
        }
    }, [channels, poll, connect]) // On ajoute "channels" comme dépendance pour que le hook réagisse

    // Fonction pour envoyer un message (via HTTP, ce qui est la norme)
    const sendMessage = useCallback(async (conversationId, content) => {
        try {
            await api.post(
                `/api/chat/conversations/${conversationId}/messages`,
                { content }
            )
        } catch (error) {
            console.error("Erreur d'envoi du message:", error)
            toast.error("L'envoi a échoué.")
        }
    }, [])

    return { messages, isConnected, sendMessage, setMessages }
}
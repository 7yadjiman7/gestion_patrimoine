// src/services/chatService.js
import api from "./apiConfig"

const subscribedChannels = new Set()
const unwrap = res => (res.data?.data ? res.data.data : res.data)

export const fetchConversations = () =>
    api.get("/api/chat/conversations").then(res => res.data)

export const fetchMessages = conversationId =>
    api.get(`/api/chat/conversations/${conversationId}/messages`).then(unwrap)

export const sendMessage = (conversationId, content) =>
    api
        .post(`/api/chat/conversations/${conversationId}/messages`, { content })
        .then(unwrap)

export const createConversation = participants =>
    api.post("/api/chat/conversations", { participants }).then(unwrap)

// --- WebSocket config ---
// CORRECTION DÉFINITIVE : L'URL doit être propre, sans port et sans paramètres.
// Nginx se chargera de la redirection.
const ODOO_WS_URL = "ws://localhost/websocket"

let socket = null
let reconnectAttempts = 0
let onMessageCallback = null

export function connectWebSocket(userId) {
    if (socket && socket.readyState === WebSocket.OPEN) return

    console.log(`🔌 Tentative de connexion WebSocket #${reconnectAttempts}...`)
    socket = new WebSocket(ODOO_WS_URL)

    socket.onopen = () => {
        console.log(
            `✅ WebSocket connecté à Odoo (Tentative #${reconnectAttempts})`
        )
        reconnectAttempts = 0
    }

    socket.onmessage = event => {
        try {
            const data = JSON.parse(event.data)
            if (onMessageCallback) {
                onMessageCallback(data)
            }
        } catch (e) {
            console.error(
                "❌ Erreur de parsing du message WebSocket:",
                event.data,
                e
            )
        }
    }

    socket.onclose = event => {
        console.warn(
            `❗ WebSocket fermé (code=${event.code}, reason=${event.reason || "aucune raison"}).`
        )
        reconnectAttempts++
        setTimeout(() => {
            connectWebSocket(userId)
        }, 5000)
    }

    socket.onerror = error => {
        console.error("🔥 Erreur WebSocket:", error)
        socket.close()
    }
}

export function subscribeToChannels(channel) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("🚫 WebSocket non connecté. Impossible de s'abonner.")
        return
    }
    if (subscribedChannels.has(channel)) {
        return
    }
    const message = {
        event_name: "subscribe",
        channels: [channel],
        last: 0,
    }
    socket.send(JSON.stringify(message))
    subscribedChannels.add(channel)
    console.log("📡 Abonnement envoyé:", message)
}

export const setOnBusMessage = callback => {
    onMessageCallback = callback
}

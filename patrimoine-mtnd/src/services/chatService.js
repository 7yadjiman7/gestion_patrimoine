// src/services/chatService.js
import api from "./apiConfig"

const unwrap = res => (res.data?.data ? res.data.data : res.data)

// --- Fonctions HTTP (inchangées) ---
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

// --- Logique WebSocket Corrigée ---
const ODOO_WS_URL = `ws://${window.location.hostname}/websocket`

let socket = null
let reconnectAttempts = 0
let onMessageCallback = null

export function connectWebSocket(channelsToSubscribe = []) {
    if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING)
    ) {
        console.warn(
            "🔌 Le WebSocket est déjà connecté ou en cours de connexion."
        )
        return
    }

    console.log(`🔌 Tentative de connexion WebSocket #${reconnectAttempts}...`)
    socket = new WebSocket(ODOO_WS_URL)

    socket.onopen = () => {
        console.log(
            `✅ WebSocket connecté à Odoo (Tentative #${reconnectAttempts})`
        )
        reconnectAttempts = 0

        if (channelsToSubscribe.length > 0) {
            console.log(
                "📡 Envoi de l'abonnement aux canaux :",
                channelsToSubscribe
            )
            const message = {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    channels: channelsToSubscribe,
                    last: 0,
                },
                id: Math.floor(Math.random() * 1000000000),
            }
            socket.send(JSON.stringify(message))
        }
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
        if (reconnectAttempts < 5) {
            reconnectAttempts++
            setTimeout(() => connectWebSocket(channelsToSubscribe), 5000)
        } else {
            console.error(
                "🚫 Nombre maximum de tentatives de reconnexion atteint."
            )
        }
    }

    socket.onerror = error => {
        console.error("🔥 Erreur WebSocket:", error)
        if (
            socket &&
            socket.readyState !== WebSocket.CLOSING &&
            socket.readyState !== WebSocket.CLOSED
        ) {
            socket.close()
        }
    }
}

export function disconnectWebSocket() {
    reconnectAttempts = 10 // Empêche les futures tentatives de reconnexion
    if (socket) {
        socket.close()
        socket = null
    }
    console.log("🔌 Connexion WebSocket fermée manuellement.")
}

export const setOnBusMessage = callback => {
    onMessageCallback = callback
}

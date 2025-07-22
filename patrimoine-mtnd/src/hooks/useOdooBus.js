// src/hooks/useOdooBus.js

import { useEffect, useRef } from "react"

export default function useOdooBus(channels, onNotification) {
    // Ref pour le socket, persiste à travers les rendus du Strict Mode
    const socketRef = useRef(null)
    // Ref pour l'ID de la dernière notification, pour éviter le "OUTDATED_VERSION"
    const lastIdRef = useRef(0)
    // Ref pour la fonction de callback
    const savedOnNotification = useRef(onNotification)

    useEffect(() => {
        savedOnNotification.current = onNotification
    }, [onNotification])

    useEffect(() => {
        // Validation des entrées. Si invalide, on ne fait rien.
        if (
            typeof savedOnNotification.current !== "function" ||
            !Array.isArray(channels) ||
            channels.length === 0
        ) {
            return
        }

        // Si une connexion est déjà en cours, on ne fait rien pour éviter les doublons du Strict Mode.
        if (socketRef.current) {
            return
        }

        const protocol = window.location.protocol === "https:" ? "wss" : "ws"
        const socketUrl = `${protocol}://${window.location.host}/websocket`

        console.log("Tentative de connexion WebSocket...")
        const ws = new WebSocket(socketUrl)
        socketRef.current = ws // On stocke l'instance dans la ref

        ws.onopen = () => {
            console.log(
                "✅ Connexion établie. Abonnement aux canaux:",
                channels
            )
            const subscriptionMessage = {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    channels,
                    last: lastIdRef.current, // On envoie le dernier ID connu
                },
                id: Math.floor(Math.random() * 1000000000),
            }
            ws.send(JSON.stringify(subscriptionMessage))
        }

        ws.onmessage = event => {
            try {
                const response = JSON.parse(event.data)
                if (response.result && Array.isArray(response.result)) {
                    response.result.forEach(notification => {
                        lastIdRef.current = notification.id // On met à jour le dernier ID reçu
                        if (notification.message) {
                            savedOnNotification.current(notification.message)
                        }
                    })
                }
            } catch (e) {
                console.error("Erreur d'analyse du message:", e)
            }
        }

        ws.onerror = error => {
            console.error("🔥 Erreur WebSocket:", error)
        }

        ws.onclose = event => {
            console.warn(`🔌 Connexion WebSocket fermée. Code: ${event.code}`)
            // On nettoie la ref pour permettre une nouvelle connexion
            socketRef.current = null
        }

        // La fonction de nettoyage de l'effet
        return () => {
            console.log("Nettoyage de l'effet...")
            // On ne ferme que si le socket existe et est en train de se connecter ou est ouvert
            if (
                ws &&
                (ws.readyState === WebSocket.CONNECTING ||
                    ws.readyState === WebSocket.OPEN)
            ) {
                console.log("Fermeture de la connexion WebSocket.")
                ws.close(1000, "Component unmounted")
            }
        }
    }, [channels]) // Dépendance unique sur les canaux
}

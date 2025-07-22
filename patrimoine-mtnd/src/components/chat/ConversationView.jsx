// src/components/chat/ConversationView.jsx

import React, { useState, useEffect, useRef } from "react"

export default function ConversationView({
    conversation,
    messages = [],
    onSendMessage,
    isLoading,
}) {
    // CORRECTION : Le useState doit être initialisé correctement
    const [inputText, setInputText] = useState("")
    const messagesEndRef = useRef(null)

    // Fait défiler la vue vers le bas à chaque nouveau message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = e => {
        e.preventDefault()
        if (!inputText.trim()) return
        onSendMessage(inputText)
        setInputText("") // Vider le champ de saisie
    }

    if (!conversation) {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                }}
            >
                <p>Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
        )
    }

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f9f9f9",
            }}
        >
            <header
                style={{
                    padding: "10px 20px",
                    borderBottom: "1px solid #e0e0e0",
                    fontWeight: "bold",
                    backgroundColor: "white",
                }}
            >
                {conversation.name}
            </header>

            <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                {isLoading ? (
                    <p>Chargement des messages...</p>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} style={{ marginBottom: "12px" }}>
                            <strong>{msg.author_name}: </strong>
                            {/* Le nom du champ a été corrigé de 'body' à 'content' pour correspondre à vos modèles */}
                            <span>{msg.content}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer
                style={{
                    padding: "10px 20px",
                    borderTop: "1px solid #e0e0e0",
                    backgroundColor: "white",
                }}
            >
                <form onSubmit={handleSubmit} style={{ display: "flex" }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Écrivez un message..."
                        style={{
                            flex: 1,
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                        }}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        style={{
                            marginLeft: "10px",
                            padding: "10px 20px",
                            border: "none",
                            backgroundColor: "#007bff",
                            color: "white",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                        disabled={isLoading}
                    >
                        Envoyer
                    </button>
                </form>
            </footer>
        </div>
    )
}

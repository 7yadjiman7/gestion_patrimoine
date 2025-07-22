// src/components/ConversationList.jsx

import React from "react"

export default function ConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
}) {
    return (
        <div
            style={{
                width: "30%",
                borderRight: "1px solid #ccc",
                overflowY: "auto",
            }}
        >
            <h2
                style={{
                    padding: "10px",
                    margin: 0,
                    borderBottom: "1px solid #ccc",
                }}
            >
                Conversations
            </h2>
            <ul>
                {conversations.map(conv => (
                    <li
                        key={conv.id}
                        onClick={() => onSelectConversation(conv)}
                        style={{
                            padding: "15px",
                            cursor: "pointer",
                            backgroundColor:
                                conv.id === activeConversationId
                                    ? "#e0e0e0"
                                    : "transparent",
                            fontWeight:
                                conv.id === activeConversationId
                                    ? "bold"
                                    : "normal",
                        }}
                    >
                        {conv.name}
                    </li>
                ))}
            </ul>
        </div>
    )
}

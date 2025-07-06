from odoo import http
from odoo.http import request, Response
import json


class ChatController(http.Controller):

    @http.route(
        "/api/chat/conversations", auth="user", type="http", methods=["GET"], csrf=False
    )
    def list_conversations(self, **kwargs):
        user = request.env.user
        conversations = (
            request.env["chat.conversation"]
            .sudo()
            .search([("participant_ids", "in", user.id)])
        )

        result = []
        for conv in conversations:
            last_message = conv.message_ids[-1] if conv.message_ids else False
            result.append(
                {
                    "id": conv.id,
                    "name": conv.name or ", ".join(conv.participant_ids.mapped("name")),
                    "last_message": (
                        last_message.body if last_message else "Aucun message"
                    ),
                    "last_date": (
                        last_message.create_date if last_message else conv.create_date
                    ),
                }
            )

        return Response(
            json.dumps(result, default=str), content_type="application/json"
        )

    @http.route(
        "/api/chat/conversations/<int:conv_id>/messages",
        auth="user",
        type="http",
        methods=["GET"],
        csrf=False,
    )
    def get_messages(self, conv_id, **kwargs):
        conv = request.env["chat.conversation"].sudo().browse(conv_id)
        if not conv.exists() or request.env.user.id not in conv.participant_ids.ids:
            return Response(
                json.dumps({"error": "Conversation not found or access denied"}),
                status=404,
                content_type="application/json",
            )

        messages = conv.message_ids.sorted("create_date")
        result = [
            {
                "id": m.id,
                "author_name": m.sender_id.name,
                "content": m.body,
                "date": m.create_date,
            }
            for m in messages
        ]
        return Response(
            json.dumps({"data": result}, default=str), content_type="application/json"
        )

    @http.route(
        "/api/chat/conversations/<int:conv_id>/messages",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
    def post_message(self, conv_id, content=None, **kwargs):
        if not content:
            return {"error": "Le contenu du message est vide."}

        conv = request.env["chat.conversation"].sudo().browse(conv_id)
        if not conv.exists() or request.env.user.id not in conv.participant_ids.ids:
            return {"error": "Conversation non trouvée ou accès non autorisé"}

        msg = (
            request.env["chat.message"]
            .sudo()
            .create(
                {
                    "conversation_id": conv.id,
                    "sender_id": request.env.user.id,
                    "body": content,
                }
            )
        )

        channel = f"chat_channel_{conv_id}"
        message_data = {
            "id": msg.id,
            "sender_id": msg.sender_id.id,
            "sender_name": msg.sender_id.name,
            "body": msg.body,
            "date": msg.create_date,
            "conversation_id": conv.id,
        }
        request.env["bus.bus"]._sendone(channel, "new_message", message_data)

        return {"status": "success", "message_id": msg.id}

    @http.route(
        "/api/chat/conversations",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
    def create_conversation(self, participants=None, **kwargs):
        user = request.env.user
        participant_ids = [user.id]
        if participants:
            participant_ids.extend([int(pid) for pid in participants])

        # Vérifier si une conversation avec exactement ces participants existe déjà
        existing_conv = (
            request.env["chat.conversation"]
            .sudo()
            .search([("participant_ids", "=", list(set(participant_ids)))], limit=1)
        )

        if existing_conv:
            conv = existing_conv
        else:
            conv = (
                request.env["chat.conversation"]
                .sudo()
                .create({"participant_ids": [(6, 0, list(set(participant_ids)))]})
            )

        result = {
            "id": conv.id,
            "name": conv.name or ", ".join(conv.participant_ids.mapped("name")),
            "last_message": False,
            "last_date": False,
        }
        return {"status": "success", "data": result}

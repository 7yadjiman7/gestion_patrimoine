from odoo import http
from odoo.http import request, Response as OdooResponse
from .common import json_response, CORS_HEADERS, ALLOWED_ORIGIN


def Response(*args, **kwargs):
    headers = kwargs.pop("headers", {})
    headers = {**CORS_HEADERS, **headers}
    return OdooResponse(*args, headers=headers, **kwargs)
import json
import logging
_logger = logging.getLogger(__name__)

class ChatController(http.Controller):

    @http.route('/api/chat/subscribe', type='json', auth='user', methods=['POST'], csrf=False, cors=ALLOWED_ORIGIN)
    def subscribe_to_channel(self, **kw):
        """
        Contrôleur pour permettre à l'utilisateur authentifié de s'abonner 
        à des canaux de discussion via des requêtes HTTP.
        """
        # Récupère les canaux depuis la requête JSON
        channels = kw.get('channels', [])
        if not channels:
            _logger.warning("Tentative d'abonnement sans spécifier de canal.")
            return {'error': 'No channels specified'}

        # Logique pour vérifier les permissions et s'abonner
        # Exemple : s'assurer que l'utilisateur a le droit de voir ces canaux
        # ... votre logique métier ici ...

        _logger.info(f"Utilisateur {request.env.user.name} abonné aux canaux : {channels}")
        
        # Odoo gère l'abonnement via le bus automatiquement si le client est connecté
        # au WebSocket avec une session valide. Ce contrôleur est plus pour la validation.
        
        return {'status': 'subscribed', 'channels': channels}

        
    @http.route(
        "/api/chat/conversations", auth="user", type="http", methods=["GET"], csrf=False, cors=ALLOWED_ORIGIN)
    def list_conversations(self, **kwargs):
        _logger.info("--- API TRACE: list_conversations a été appelée ---")
        user = request.env.user
        conversations = (
            request.env["chat.conversation"]
            .sudo()
            .search([("participant_ids", "in", user.id)])
        )

        result = []
        for conv in conversations:
            last_message = conv.message_ids[-1] if conv.message_ids else False
            other_partners = conv.participant_ids.filtered(
                lambda u: u.id != user.id
            )

            # CORRECTION : On calcule un nom de conversation plus propre
            other_participants = conv.participant_ids.filtered(lambda p: p.id != user.id)
            conv_name = conv.name or ", ".join(other_partners.mapped("name"))
            result.append(
                {
                    "id": conv.id,
                    "name": conv_name,
                    "last_message": (
                        last_message.body if last_message else "Aucun message"
                    ),
                    "last_date": (
                        last_message.create_date if last_message else conv.create_date
                    ),
                }
            )

        return json_response(result)

    @http.route(
        "/api/chat/conversations/<int:conv_id>/messages",
        auth="user",
        type="http",
        methods=["GET"],
        csrf=False, cors=ALLOWED_ORIGIN)
    def get_messages(self, conv_id, **kwargs):
        _logger.info(
            f"--- API TRACE: get_messages a été appelée pour la conv {conv_id} ---"
        )
        conv = request.env["chat.conversation"].sudo().browse(conv_id)
        if not conv.exists() or request.env.user.id not in conv.participant_ids.ids:
            return json_response({"error": "Conversation non trouvée ou accès refusé"}, status=404)

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
        return json_response({"data": result})

    @http.route(
        "/api/chat/conversations/<int:conv_id>/messages",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False, cors=ALLOWED_ORIGIN)
    def post_message(self, conv_id, content=None, **kwargs):
        _logger.info(
            f"--- API TRACE: post_message a été appelée pour la conv {conv_id} avec le contenu: {content} ---"
        )
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
                    "body": content,
                }
            )
        )

        # channel = f"chat_channel_{conv_id}"
        # message_data = {
        #     "type": "chat_message",
        #     "id": msg.id,
        #     "sender_id": msg.sender_id.id,
        #     "sender_name": msg.sender_id.name,
        #     "body": msg.body,
        #     "date": msg.create_date,
        #     "conversation_id": conv.id,
        # }
        # request.env["bus.bus"]._sendone(channel, 'new_message', message_data)

        # On retourne le message complet à l'envoyeur
        return {"status": "success", "message_id": msg.id}

    @http.route(
        "/api/chat/conversations",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False, cors=ALLOWED_ORIGIN)
    def create_conversation(self, participants=None, **kwargs):
        user = request.env.user
        participant_ids = [user.id]
        if participants:
            participant_ids.extend([int(pid) for pid in participants])

        # Vérifier si une conversation avec exactement ces participants existe déjà
        chat_conv_model = request.env["chat.conversation"].sudo()
        conversations = chat_conv_model.search(
            [("participant_ids", "in", list(set(participant_ids)))]
        )
        existing_conv = False
        for c in conversations:
            if set(c.participant_ids.ids) == set(participant_ids):
                existing_conv = c
                break

        if existing_conv:
            conv = existing_conv
        else:
            conv = (
                request.env["chat.conversation"]
                .sudo()
                .create({"participant_ids": [(6, 0, list(set(participant_ids)))]})
            )

        other_partners = conv.participant_ids.filtered(lambda u: u.id != user.id)
        conv_name = conv.name or ", ".join(other_partners.mapped("name"))
        result = {
            "id": conv.id,
            "name": conv_name,
            "last_message": False,
            "last_date": False,
        }
        return {"status": "success", "data": result}

    @http.route('/intranet/chat', auth='user', type='http', website=True)
    def chat_page(self, **kwargs):
        """Simple page to test the real time chat inside Odoo."""
        return request.render('gestion_patrimoine.chat_page_template')

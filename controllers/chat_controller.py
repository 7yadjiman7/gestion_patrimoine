from odoo import http
from odoo.http import request, Response
import json

# Headers CORS standard (alignés sur asset_controller)
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token, X-Openerp-Session-Id",
    "Access-Control-Allow-Credentials": "true",
}

# Réutilise le décorateur de gestion d'erreurs de l'asset controller
from .asset_controller import handle_api_errors

class ChatController(http.Controller):
    @http.route('/api/chat/conversations', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def list_conversations(self, **kwargs):
        public_uid = request.env.ref('base.public_user').id
        if not request.session.uid or request.session.uid == public_uid:
            return Response(
                json.dumps({'status': 'error', 'code': 401, 'message': 'Authentication required'}),
                status=401,
                headers=CORS_HEADERS
            )

        user = request.env.user
        conversations = request.env['chat.conversation'].sudo().search([
            ('participant_ids', 'in', user.id)
        ])
        result = []
        for conv in conversations:
            last_message = conv.message_ids and conv.message_ids[-1] or False
            result.append({
                'id': conv.id,
                'name': conv.name or ', '.join(conv.participant_ids.mapped('name')),
                'last_message': last_message.body if last_message else False,
                'last_date': last_message.date if last_message else False,
            })
        return Response(json.dumps({'status': 'success', 'data': result}), headers=CORS_HEADERS)

    @http.route('/api/chat/conversations/<int:conv_id>/messages', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def get_messages(self, conv_id, **kwargs):
        conv = request.env['chat.conversation'].sudo().browse(conv_id)
        if not conv.exists():
            return Response(
                json.dumps({'status': 'error', 'code': 404, 'message': 'Conversation not found'}),
                status=404,
                headers=CORS_HEADERS
            )
        if request.env.user.id not in conv.participant_ids.ids:
            return Response(
                json.dumps({'status': 'error', 'code': 403, 'message': 'Forbidden'}),
                status=403,
                headers=CORS_HEADERS
            )
        messages = conv.message_ids.sorted('date')
        result = [
            {
                'id': m.id,
                'author_name': m.sender_id.name,
                'content': m.body,
                'date': m.date,
            }
            for m in messages
        ]
        return Response(json.dumps({'status': 'success', 'data': result}), headers=CORS_HEADERS)

    @http.route('/api/chat/conversations/<int:conv_id>/messages', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def post_message(self, conv_id, **kwargs):
        data = request.jsonrequest or {}
        content = data.get('content')
        conv = request.env['chat.conversation'].sudo().browse(conv_id)
        if not conv.exists():
            return Response(
                json.dumps({'status': 'error', 'code': 404, 'message': 'Conversation not found'}),
                status=404,
                headers=CORS_HEADERS
            )
        if request.env.user.id not in conv.participant_ids.ids:
            return Response(
                json.dumps({'status': 'error', 'code': 403, 'message': 'Forbidden'}),
                status=403,
                headers=CORS_HEADERS
            )
        msg = request.env['chat.message'].sudo().create({
            'conversation_id': conv.id,
            'sender_id': request.env.user.id,
            'body': content,
        })
        result = {
            'id': msg.id,
            'author_name': msg.sender_id.name,
            'content': msg.body,
            'date': msg.date,
        }
        return Response(json.dumps({'status': 'success', 'data': result}), headers=CORS_HEADERS)

    @http.route('/api/chat/conversations', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def create_conversation(self, **kwargs):
        data = request.jsonrequest or {}
        participants = data.get('participants')
        name = data.get('name')
        """Create a new chat conversation."""
        user = request.env.user
        participant_ids = [user.id]
        if participants:
            if isinstance(participants, (str, int)):
                participant_ids.append(int(participants))
            else:
                try:
                    participant_ids.extend([int(pid) for pid in participants])
                except Exception:
                    pass

        conv = request.env['chat.conversation'].sudo().create({
            'name': name,
            'participant_ids': [(6, 0, list(set(participant_ids)))]
        })

        last_message = conv.message_ids and conv.message_ids[-1] or False
        result = {
            'id': conv.id,
            'name': conv.name or ', '.join(conv.participant_ids.mapped('name')),
            'last_message': last_message.body if last_message else False,
            'last_date': last_message.date if last_message else False,
        }
        return Response(json.dumps({'status': 'success', 'data': result}), headers=CORS_HEADERS)

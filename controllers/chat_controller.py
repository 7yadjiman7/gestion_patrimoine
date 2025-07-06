from odoo import http
from odoo.http import request

class ChatController(http.Controller):
    @http.route('/api/chat/conversations', auth='user', type='json', methods=['GET'], csrf=False)
    def list_conversations(self, **kwargs):
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
        return result

    @http.route('/api/chat/conversations/<int:conv_id>/messages', auth='user', type='json', methods=['GET'], csrf=False)
    def get_messages(self, conv_id, **kwargs):
        conv = request.env['chat.conversation'].sudo().browse(conv_id)
        if not conv.exists() or request.env.user.id not in conv.participant_ids.ids:
            return []
        messages = conv.message_ids.sorted('date')
        return [
            {
                'id': m.id,
                'author_name': m.sender_id.name,
                'content': m.body,
                'date': m.date,
            }
            for m in messages
        ]

    @http.route('/api/chat/conversations/<int:conv_id>/messages', auth='user', type='json', methods=['POST'], csrf=False)
    def post_message(self, conv_id, content, **kwargs):
        conv = request.env['chat.conversation'].sudo().browse(conv_id)
        if not conv.exists() or request.env.user.id not in conv.participant_ids.ids:
            return {'error': 'Conversation not found'}
        msg = request.env['chat.message'].sudo().create({
            'conversation_id': conv.id,
            'sender_id': request.env.user.id,
            'body': content,
        })
        return {
            'id': msg.id,
            'author_name': msg.sender_id.name,
            'content': msg.body,
            'date': msg.date,
        }

    @http.route('/api/chat/conversations', auth='user', type='json', methods=['POST'], csrf=False)
    def create_conversation(self, participants=None, name=None, **kwargs):
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
        return {
            'id': conv.id,
            'name': conv.name or ', '.join(conv.participant_ids.mapped('name')),
            'last_message': last_message.body if last_message else False,
            'last_date': last_message.date if last_message else False,
        }

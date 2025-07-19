from odoo import models, fields, api

class ChatConversation(models.Model):
    _name = "chat.conversation"
    _description = "Conversation"

    name = fields.Char(string="Nom")
    participant_ids = fields.Many2many(
        "res.users", string="Participants"
    )
    message_ids = fields.One2many(
        "chat.message", "conversation_id", string="Messages"
    )


class ChatMessage(models.Model):
    _name = "chat.message"
    _description = "Message"
    _order = "create_date asc"

    conversation_id = fields.Many2one(
        "chat.conversation",
        string="Conversation",
        required=True,
        ondelete="cascade",
    )
    sender_id = fields.Many2one(
        "res.users", string="Exp\xC3\xA9diteur", required=True, default=lambda self: self.env.user
    )
    body = fields.Text(string="Contenu", required=True)

    @api.model_create_multi
    def create(self, vals_list):
        messages = super().create(vals_list)
        for message in messages:
            # On prépare le payload de la notification
            payload = {
                "id": message.id,
                "author_name": message.sender_id.name,
                "content": message.body,
                "date": message.create_date.strftime("%Y-%m-%d %H:%M:%S"),
                "conversation_id": message.conversation_id.id,
            }

            # On définit un canal unique pour cette conversation
            channel_name = f"chat_channel_{message.conversation_id.id}"

            # 2. On envoie un seul message à cette salle de discussion
            self.env["bus.bus"]._sendone(channel_name, "new_message", payload)

        return messages

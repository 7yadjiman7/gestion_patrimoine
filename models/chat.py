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
    _order = "date asc"

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
    date = fields.Datetime(string="Date", default=fields.Datetime.now)

    @api.model_create_multi
    def create(self, vals_list):
        """Create messages and notify participants on the bus."""
        messages = super().create(vals_list)

        Bus = self.env['bus.bus']
        notifications = []

        for message in messages:
            participants = message.conversation_id.participant_ids
            payload = {
                'id': message.id,
                'author_name': message.sender_id.name,
                'content': message.body,
                'conversation_id': message.conversation_id.id,
            }
            for partner in participants.mapped('partner_id'):  # unique partners
                channel = (self._cr.dbname, 'mail.channel', partner.id)
                notifications.append((channel, payload))

        if notifications:
            Bus.sendmany(notifications)

        return messages

from odoo import models, fields

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

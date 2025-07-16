# gestion_patrimoine/models/chat_test.py
from odoo import models, fields

class ChatTest(models.TransientModel):
    _name = 'chat.test'
    _description = 'Page de Test pour le Chat Intranet'
    _inherit = ["mail.thread"]

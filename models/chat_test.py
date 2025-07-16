# gestion_patrimoine/models/chat_test.py
__test__ = False
try:
    from odoo import models, fields
except ModuleNotFoundError:  # allow import when Odoo isn't available
    import types
    models = types.SimpleNamespace(TransientModel=object)
    fields = types.SimpleNamespace()

class ChatTest(models.TransientModel):
    _name = 'chat.test'
    _description = 'Page de Test pour le Chat Intranet'
    _inherit = ["mail.thread"]

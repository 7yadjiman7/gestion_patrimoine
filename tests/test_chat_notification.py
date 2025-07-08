import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types

# Provide a minimal stub of the `odoo` framework for the model import
odoo = types.ModuleType("odoo")
class BaseModel:
    @classmethod
    def create(cls, vals_list):
        return []
odoo.models = types.SimpleNamespace(Model=BaseModel)
odoo.fields = types.SimpleNamespace(
    Char=MagicMock(),
    Many2many=MagicMock(),
    One2many=MagicMock(),
    Many2one=MagicMock(),
    Text=MagicMock(),
    Datetime=MagicMock(),
    Image=MagicMock(),
    Boolean=MagicMock(),
    Selection=MagicMock(),
    Integer=MagicMock(),
    Float=MagicMock(),
    Date=MagicMock(),
    Binary=MagicMock(),
    Json=MagicMock(),
)
odoo._ = lambda x: x
sys.modules['odoo'] = odoo
sys.modules['odoo.models'] = odoo.models
sys.modules['odoo.fields'] = odoo.fields

import importlib.util

# Load the chat model without executing the full models package
chat_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'chat.py')
spec = importlib.util.spec_from_file_location('models.chat', chat_path)
chat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chat)
sys.modules.setdefault('models.chat', chat)
models_pkg = types.ModuleType('models')
models_pkg.chat = chat
chat.models = types.SimpleNamespace(Model=odoo.models.Model)
sys.modules.setdefault('models', models_pkg)

class ChatMessageNotificationTest(unittest.TestCase):
    def test_create_triggers_bus_send(self):
        fake_env = MagicMock()
        fake_bus = MagicMock()
        fake_env.__getitem__.return_value = fake_bus
        fake_record = MagicMock()
        fake_record.id = 1
        fake_record.body = 'hi'
        fake_record.conversation_id.participant_ids.mapped.return_value = [
            MagicMock(partner_id=MagicMock(id=10)),
            MagicMock(partner_id=MagicMock(id=11)),
        ]
        fake_record.sender_id.name = 'Demo'
        FakeSelf = type('FakeSelf', (chat.ChatMessage,), {})
        fake_self = FakeSelf()
        fake_self.env = fake_env
        fake_self._cr = MagicMock(dbname='test')
        with patch('models.chat.models.Model.create', return_value=[fake_record]):
            chat.ChatMessage.create(fake_self, [{'conversation_id': 1, 'body': 'hi'}])
        fake_bus.sendmany.assert_called_once()

if __name__ == '__main__':
    unittest.main()

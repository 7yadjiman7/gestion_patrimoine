import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types

# Minimal odoo stubs
odoo = types.ModuleType("odoo")
def _response_side_effect(*args, **kwargs):
    return MagicMock(headers={'Content-Type': 'application/json'}, status_code=kwargs.get('status'))

odoo.http = types.SimpleNamespace(
    Controller=object,
    route=lambda *a, **k: (lambda f: f),
    request=MagicMock(),
    Response=MagicMock(side_effect=_response_side_effect),
)
odoo.fields = types.SimpleNamespace(Char=MagicMock(), Many2many=MagicMock(), One2many=MagicMock(), Many2one=MagicMock(), Text=MagicMock(), Datetime=MagicMock())
odoo.models = types.SimpleNamespace(Model=object)
odoo._ = lambda x: x
sys.modules.setdefault("odoo", odoo)
sys.modules.setdefault("odoo.http", odoo.http)
sys.modules.setdefault("odoo.fields", odoo.fields)
sys.modules.setdefault("odoo.models", odoo.models)

import importlib.util

# Load controller without executing package __init__
controllers_pkg = types.ModuleType('controllers')
controllers_pkg.__path__ = []
sys.modules.setdefault('controllers', controllers_pkg)

chat_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'chat_controller.py')
spec = importlib.util.spec_from_file_location('controllers.chat_controller', chat_path)
chat_controller = importlib.util.module_from_spec(spec)
sys.modules['controllers.chat_controller'] = chat_controller
spec.loader.exec_module(chat_controller)
controllers_pkg.chat_controller = chat_controller


class ChatControllerTest(unittest.TestCase):
    def setUp(self):
        self.controller = chat_controller.ChatController()

    @patch('controllers.chat_controller.request')
    def test_create_conversation_existing(self, mock_request):
        env = MagicMock()
        conv_model = MagicMock()
        env.__getitem__.return_value = conv_model
        conv_model.sudo.return_value = conv_model
        conv_record = MagicMock(id=5)
        conv_record.participant_ids.ids = [1, 2]
        conv_model.search.return_value = [conv_record]
        mock_request.env = env
        mock_request.env.user.id = 1

        res = self.controller.create_conversation(participants=[2])

        conv_model.search.assert_called_with([('participant_ids', 'in', [1, 2])])
        conv_model.create.assert_not_called()
        self.assertEqual(res['data']['id'], conv_record.id)

    @patch('controllers.chat_controller.request')
    def test_create_conversation_new(self, mock_request):
        env = MagicMock()
        conv_model = MagicMock()
        env.__getitem__.return_value = conv_model
        conv_model.sudo.return_value = conv_model
        conv_model.search.return_value = []
        new_conv = MagicMock(id=7, participant_ids=MagicMock(mapped=lambda x: ['u1','u2']))
        conv_model.create.return_value = new_conv
        mock_request.env = env
        mock_request.env.user.id = 1

        res = self.controller.create_conversation(participants=[2])

        conv_model.search.assert_called_with([('participant_ids', 'in', [1, 2])])
        conv_model.create.assert_called_once()
        self.assertEqual(res['status'], 'success')


if __name__ == '__main__':
    unittest.main()

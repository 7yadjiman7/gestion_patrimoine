import unittest
from unittest.mock import MagicMock, patch
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import models.chat as chat

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
        fake_self = MagicMock()
        fake_self.env = fake_env
        fake_self._cr.dbname = 'test'
        with patch('models.chat.models.Model.create', return_value=[fake_record]):
            chat.ChatMessage.create(fake_self, [{'conversation_id': 1, 'body': 'hi'}])
        fake_bus.sendmany.assert_called_once()

if __name__ == '__main__':
    unittest.main()

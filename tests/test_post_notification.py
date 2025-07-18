import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types

# Minimal stub of Odoo
odoo = types.ModuleType("odoo")
class BaseModel:
    @classmethod
    def create(cls, vals_list):
        return []
odoo.models = types.SimpleNamespace(Model=BaseModel)
odoo.fields = types.SimpleNamespace(Char=MagicMock(), Many2one=MagicMock(), Text=MagicMock(), Image=MagicMock(), Many2many=MagicMock(), One2many=MagicMock(), Selection=MagicMock(), Datetime=MagicMock(), Integer=MagicMock(), Boolean=MagicMock())
odoo.api = types.SimpleNamespace(
    model_create_multi=lambda f: f,
    depends=lambda *args: (lambda f: f),
)
odoo._ = lambda x: x
sys.modules['odoo'] = odoo
sys.modules['odoo.models'] = odoo.models
sys.modules['odoo.fields'] = odoo.fields
sys.modules['odoo.api'] = odoo.api

import importlib.util

post_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'post.py')
spec = importlib.util.spec_from_file_location('models.post', post_path)
post = importlib.util.module_from_spec(spec)
spec.loader.exec_module(post)
sys.modules.setdefault('models.post', post)
models_pkg = types.ModuleType('models')
models_pkg.post = post
post.models = types.SimpleNamespace(Model=odoo.models.Model)
sys.modules.setdefault('models', models_pkg)

class PostNotificationTest(unittest.TestCase):
    def test_create_sends_bus_notification(self):
        fake_env = MagicMock()
        fake_bus = MagicMock()
        fake_user_model = MagicMock()
        fake_env.__getitem__.side_effect = lambda model: fake_bus if model == 'bus.bus' else fake_user_model
        fake_user_model.search.return_value = MagicMock(mapped=MagicMock(return_value=[MagicMock(id=5)]))
        fake_record = MagicMock()
        fake_record.id = 1
        fake_record.name = 't'
        fake_record.user_id.name = 'u'
        fake_record.create_date.strftime.return_value = 'd'
        FakeSelf = type('FakeSelf', (post.IntranetPost,), {})
        fake_self = FakeSelf()
        fake_self.env = fake_env
        fake_self._cr = MagicMock(dbname='x')
        with patch('models.post.models.Model.create', return_value=[fake_record]):
            post.IntranetPost.create(fake_self, [{'name': 't'}])
        fake_bus.sendmany.assert_called_once()
        args, _ = fake_bus.sendmany.call_args
        self.assertEqual(args[0][0][1]['type'], 'new_post')

if __name__ == '__main__':
    unittest.main()

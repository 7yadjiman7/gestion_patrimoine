import unittest
from unittest.mock import MagicMock, patch
import os
import sys

import types

# Create a minimal stub for the `odoo` package used by controllers
odoo = types.ModuleType("odoo")
def _response_side_effect(*args, **kwargs):
    return MagicMock(headers={'Content-Type': 'application/json'}, status_code=kwargs.get('status'))

odoo.http = types.SimpleNamespace(
    Controller=object,
    route=lambda *a, **k: (lambda f: f),
    request=MagicMock(),
    Response=MagicMock(side_effect=_response_side_effect),
)
odoo.exceptions = types.SimpleNamespace(AccessError=Exception, ValidationError=Exception)
odoo.fields = types.SimpleNamespace(
    Date=MagicMock(),
    Datetime=MagicMock(),
    Char=MagicMock(),
    Text=MagicMock(),
    Selection=MagicMock(),
    Many2one=MagicMock(),
    Many2many=MagicMock(),
    One2many=MagicMock(),
    Image=MagicMock(),
    Integer=MagicMock(),
    Boolean=MagicMock(),
)
odoo.models = types.SimpleNamespace(Model=object)
odoo.osv = types.SimpleNamespace(expression=MagicMock())
odoo.api = types.SimpleNamespace(
    depends=lambda *args: (lambda f: f),
    model_create_multi=lambda f: f,
)
odoo._ = lambda x: x

sys.modules['odoo'] = odoo
sys.modules['odoo.http'] = odoo.http
sys.modules['odoo.exceptions'] = odoo.exceptions
sys.modules['odoo.fields'] = odoo.fields
sys.modules['odoo.models'] = odoo.models
sys.modules['odoo.osv'] = odoo.osv
sys.modules['odoo.api'] = odoo.api

# Stub for external dependency used by asset_controller
import types as _types
dateutil = _types.ModuleType('dateutil')
relativedelta_mod = _types.ModuleType('dateutil.relativedelta')
relativedelta_mod.relativedelta = MagicMock()
dateutil.relativedelta = relativedelta_mod
sys.modules.setdefault('dateutil', dateutil)
sys.modules.setdefault('dateutil.relativedelta', relativedelta_mod)

# Minimal stub for werkzeug.exceptions.BadRequest
werkzeug_exceptions = _types.ModuleType('werkzeug.exceptions')
werkzeug_exceptions.BadRequest = type('BadRequest', (Exception,), {})
sys.modules.setdefault('werkzeug.exceptions', werkzeug_exceptions)

import importlib.util

# Load the controller without executing the controllers package __init__
controllers_pkg = types.ModuleType('controllers')
controllers_pkg.__path__ = []

# Provide a minimal stub for asset_controller used by post_controller
asset_controller = types.ModuleType('controllers.asset_controller')
def handle_api_errors(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

asset_controller.handle_api_errors = handle_api_errors
asset_controller.CORS_HEADERS = {}

controllers_pkg.asset_controller = asset_controller
sys.modules.setdefault('controllers', controllers_pkg)
sys.modules.setdefault('controllers.asset_controller', asset_controller)

post_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'post_controller.py')
spec = importlib.util.spec_from_file_location('controllers.post_controller', post_path)
post_controller = importlib.util.module_from_spec(spec)
spec.loader.exec_module(post_controller)
sys.modules['controllers.post_controller'] = post_controller


class PostControllerTest(unittest.TestCase):
    def setUp(self):
        self.controller = post_controller.IntranetPostController()

    @patch('controllers.post_controller.request')
    def test_list_posts_order(self, mock_request):
        env = MagicMock()
        posts = [
            MagicMock(id=1, name='A', body='b', user_id=MagicMock(name='u'), create_date='2024-01-01', post_type='text', attachment_ids=[], like_ids=[], comment_ids=[]),
            MagicMock(id=2, name='B', body='b', user_id=MagicMock(name='u'), create_date='2024-01-02', post_type='text', attachment_ids=[], like_ids=[], comment_ids=[]),
        ]
        env['intranet.post'].sudo().search.return_value = posts
        mock_request.env = env
        res = self.controller.list_posts()
        env['intranet.post'].sudo().search.assert_called_with([], order='create_date desc')
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_toggle_like_create(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.exists.return_value = True
        env['intranet.post'].sudo().browse.return_value = post
        like_model = MagicMock()
        env['intranet.post.like'].sudo.return_value = like_model
        like_model.search.return_value = []
        mock_request.env = env
        mock_request.env.user.id = 5

        res = self.controller.toggle_like(1)
        like_model.create.assert_called_once()
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_create_post_missing_name_returns_400(self, mock_request):
        env = MagicMock()
        mock_request.env = env
        files_mock = MagicMock()
        files_mock.getlist.return_value = []
        files_mock.get.return_value = None
        mock_request.httprequest.files = files_mock
        mock_request.httprequest.form.to_dict.return_value = {}
        mock_request.jsonrequest = None

        res = self.controller.create_post()

        self.assertEqual(res.status_code, 400)
        env['intranet.post'].sudo().create.assert_not_called()

    @patch('controllers.post_controller.request')
    def test_create_post_json_missing_name_returns_400(self, mock_request):
        env = MagicMock()
        mock_request.env = env
        files_mock = MagicMock()
        files_mock.getlist.return_value = []
        files_mock.get.return_value = None
        mock_request.httprequest.files = files_mock
        mock_request.httprequest.form.to_dict.return_value = {}
        mock_request.jsonrequest = {}

        res = self.controller.create_post()

        self.assertEqual(res.status_code, 400)
        env['intranet.post'].sudo().create.assert_not_called()


if __name__ == '__main__':
    unittest.main()

import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import json

import types

# Create a minimal stub for the `odoo` package used by controllers
odoo = types.ModuleType("odoo")

def _response_side_effect(*args, **kwargs):
    resp = MagicMock()
    headers = {"Content-Type": "application/json"}
    headers.update(kwargs.get("headers", {}))
    resp.headers = headers
    resp.status_code = kwargs.get("status")
    return resp

odoo.http = types.SimpleNamespace(
    Controller=object,
    route=lambda *a, **k: (lambda f: f),
    request=MagicMock(),
    Response=MagicMock(side_effect=_response_side_effect),
)
odoo.http.Response.return_value.headers = {"Content-Type": "application/json"}
class _AccessError(Exception):
    pass

class _ValidationError(Exception):
    pass

odoo.exceptions = types.SimpleNamespace(AccessError=_AccessError, ValidationError=_ValidationError)
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

sys.modules.setdefault('odoo', odoo)
sys.modules.setdefault('odoo.http', odoo.http)
sys.modules.setdefault('odoo.exceptions', odoo.exceptions)
sys.modules.setdefault('odoo.fields', odoo.fields)
sys.modules.setdefault('odoo.models', odoo.models)
sys.modules.setdefault('odoo.osv', odoo.osv)
sys.modules.setdefault('odoo.api', odoo.api)

# Stub for external dependencies
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

# Provide a minimal stub for common module used by post_controller
common_module = types.ModuleType('controllers.common')

def handle_api_errors(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception:
            resp = MagicMock()
            resp.status_code = 400
            return resp
    return wrapper

common_module.handle_api_errors = handle_api_errors
common_module.CORS_HEADERS = {}
common_module.ALLOWED_ORIGIN = "http://testserver"
common_module.json_response = lambda data, status=200: data

controllers_pkg.common = common_module
sys.modules.setdefault('controllers', controllers_pkg)
sys.modules.setdefault('controllers.common', common_module)

post_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'post_controller.py')
spec = importlib.util.spec_from_file_location('controllers.post_controller', post_path)
post_controller = importlib.util.module_from_spec(spec)
spec.loader.exec_module(post_controller)
sys.modules.setdefault('controllers.post_controller', post_controller)
controllers_pkg.post_controller = post_controller


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
        post.id = 42
        post.exists.return_value = True
        post_model = MagicMock()
        post_model.browse = MagicMock(return_value=post)
        env['intranet.post'].sudo.return_value = post_model
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
        # On garde la version la plus explicite pour simuler la requête
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
        # On garde la version la plus explicite ici aussi
        files_mock = MagicMock()
        files_mock.getlist.return_value = []
        files_mock.get.return_value = None
        mock_request.httprequest.files = files_mock
        mock_request.httprequest.form.to_dict.return_value = {}
        mock_request.jsonrequest = {}

        res = self.controller.create_post()

        self.assertEqual(res.status_code, 400)
        env['intranet.post'].sudo().create.assert_not_called()

    @patch('controllers.post_controller.request')
    def test_add_comment_without_content_returns_400(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.id = 42
        post.exists.return_value = True
        post_model = MagicMock()
        post_model.browse = MagicMock(return_value=post)
        env['intranet.post'].sudo.return_value = post_model
        env['intranet.post.comment'].sudo.return_value = MagicMock()
        mock_request.env = env
        mock_request.jsonrequest = None

        res = self.controller.add_comment(1)

        self.assertEqual(res.status_code, 400)
        env['intranet.post.comment'].sudo().create.assert_not_called()

    @patch('controllers.post_controller.request')
    def test_add_comment_success(self, mock_request):
        env = MagicMock()
        post_model = MagicMock()
        comment_model = MagicMock()
        env.__getitem__.side_effect = lambda key: post_model if key == 'intranet.post' else comment_model
        post = MagicMock()
        post.exists.return_value = True
        post.id = 2
        post_model.sudo.return_value.browse.return_value = post
        comment_model.sudo.return_value = comment_model
        comment_model.search.return_value = []
        comment_model.create.return_value = MagicMock(id=4)
        mock_request.env = env
        mock_request.env.user.id = 9
        mock_request.jsonrequest = None

        res = self.controller.add_comment(2, content='hello')

        comment_model.create.assert_called_with({'post_id': post.id, 'user_id': 9, 'content': 'hello'})
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.Response')
    @patch('controllers.post_controller.request')
    def test_get_comments(self, mock_request, mock_response):
        env = MagicMock()
        post_model = MagicMock()
        comment_model = MagicMock()
        env.__getitem__.side_effect = lambda key: post_model if key == 'intranet.post' else comment_model
        post = MagicMock()
        post.exists.return_value = True
        post.id = 5
        post_model.sudo.return_value.browse.return_value = post
        c1 = MagicMock(id=1, content='c', user_id=MagicMock(name='u1', id=2), create_date='d1')
        c1.parent_id = None
        c2 = MagicMock(id=2, content='d', user_id=MagicMock(name='u2', id=3), create_date='d2')
        c2.parent_id = None
        comment_model.search.return_value = [c1, c2]
        comment_model.sudo.return_value = comment_model
        mock_request.env = env

        self.controller.get_comments(5)

        comment_model.search.assert_called_with([
            ('post_id', '=', post.id),
            ('parent_id', '=', False)
        ], order='create_date asc')
        args, kwargs = mock_response.call_args
        payload = json.loads(args[0])
        for comment in payload['data']:
            self.assertIn('parent_id', comment)
            self.assertIsNone(comment['parent_id'])

    @patch('controllers.post_controller.request')
    def test_add_view_adds_user(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.id = 42
        post.exists.return_value = True
        env['intranet.post'].sudo().browse.return_value = post
        mock_request.env = env
        mock_request.env.user.id = 8

        res = self.controller.add_view(2)

        post.write.assert_called_with({'viewer_ids': [(4, 8)]})
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_add_comment_with_parent(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.id = 42
        post.exists.return_value = True
        post_model = MagicMock()
        post_model.browse = MagicMock(return_value=post)
        env['intranet.post'].sudo.return_value = post_model
        comment_model = MagicMock()
        env['intranet.post.comment'].sudo.return_value = comment_model
        mock_request.env = env
        mock_request.env.user.id = 9
        mock_request.jsonrequest = None

        self.controller.add_comment(1, content='child', parent_id=5)

        comment_model.create.assert_called_once()
        args = comment_model.create.call_args[0][0]
        self.assertEqual(args.get('parent_id'), 5)

    @patch('controllers.post_controller.request')
    def test_add_comment_json_payload(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.id = 7
        post.exists.return_value = True
        post_model = MagicMock()
        comment_model = MagicMock()
        env.__getitem__.side_effect = (
            lambda key: post_model if key == 'intranet.post' else comment_model
        )
        post_model.sudo.return_value.browse.return_value = post
        comment_model.sudo.return_value = comment_model
        comment_model.search.return_value = []
        mock_request.env = env
        mock_request.env.user.id = 4

        mock_request.jsonrequest = {'content': 'hello json'}
        mock_request.httprequest = MagicMock()
        mock_request.httprequest.data = None

        res = self.controller.add_comment(7)

        comment_model.create.assert_called_with({'post_id': post.id, 'user_id': 4, 'content': 'hello json'})
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_add_comment_form_payload(self, mock_request):
        env = MagicMock()
        post = MagicMock()
        post.id = 10
        post.exists.return_value = True
        post_model = MagicMock()
        comment_model = MagicMock()
        env.__getitem__.side_effect = (
            lambda key: post_model if key == 'intranet.post' else comment_model
        )
        post_model.sudo.return_value.browse.return_value = post
        comment_model.sudo.return_value = comment_model
        comment_model.search.return_value = []
        mock_request.env = env
        mock_request.env.user.id = 12

        mock_request.jsonrequest = None
        httprequest = MagicMock()
        form_mock = MagicMock()
        form_mock.to_dict.return_value = {'content': 'form hello'}
        httprequest.form = form_mock
        httprequest.data = None
        mock_request.httprequest = httprequest
        mock_request.params = {}

        res = self.controller.add_comment(10)

        comment_model.create.assert_called_with({'post_id': post.id, 'user_id': 12, 'content': 'form hello'})
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.post_controller.request')
    def test_add_comment_second_root_comment_returns_400(self, mock_request):
        env = MagicMock()
        post_model = MagicMock()
        comment_model = MagicMock()
        env.__getitem__.side_effect = lambda key: post_model if key == 'intranet.post' else comment_model
        post = MagicMock()
        post.exists.return_value = True
        post.id = 15
        post_model.sudo.return_value.browse.return_value = post
        comment_model.sudo.return_value = comment_model
        comment_model.search.return_value = [MagicMock(id=1)]
        mock_request.env = env
        mock_request.env.user.id = 3
        mock_request.jsonrequest = {'content': 'dup'}

        res = self.controller.add_comment(15)

        self.assertEqual(res.status_code, 400)
        comment_model.create.assert_not_called()

    @patch('controllers.post_controller.Response')
    @patch('controllers.post_controller.request')
    def test_get_comments_with_children(self, mock_request, mock_response):
        env = MagicMock()
        post = MagicMock()
        post.exists.return_value = True
        env['intranet.post'].sudo().browse.return_value = post
        comment_model = MagicMock()
        env['intranet.post.comment'].sudo.return_value = comment_model

        child = MagicMock(id=2, user_id=MagicMock(id=4, name='U2'), content='c2', create_date='d2', child_ids=[])
        parent = MagicMock(id=1, user_id=MagicMock(id=3, name='U1'), content='c1', create_date='d1', child_ids=[child])
        parent.parent_id = None
        child.parent_id = MagicMock(id=parent.id)
        comment_model.search.return_value = [parent]
        mock_request.env = env

        self.controller.get_comments(1)

        args, kwargs = mock_response.call_args
        payload = json.loads(args[0])
        self.assertEqual(len(payload['data'][0]['children']), 1)
        parent_payload = payload['data'][0]
        child_payload = parent_payload['children'][0]
        self.assertIn('parent_id', parent_payload)
        self.assertIsNone(parent_payload['parent_id'])
        self.assertEqual(child_payload['parent_id'], parent_payload['id'])


if __name__ == '__main__':
    unittest.main()

import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types
import importlib.util

# Minimal Odoo stubs
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

class AccessError(Exception):
    pass

class ValidationError(Exception):
    pass

odoo.exceptions = types.SimpleNamespace(AccessError=AccessError, ValidationError=ValidationError)
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
odoo.api = types.SimpleNamespace(depends=lambda *a: (lambda f: f), model_create_multi=lambda f: f)
odoo._ = lambda x: x

sys.modules['odoo'] = odoo
sys.modules['odoo.http'] = odoo.http
sys.modules['odoo.exceptions'] = odoo.exceptions
sys.modules['odoo.fields'] = odoo.fields
sys.modules['odoo.models'] = odoo.models
sys.modules['odoo.osv'] = odoo.osv
sys.modules['odoo.api'] = odoo.api

# External stubs
import types as _types
dateutil = _types.ModuleType('dateutil')
relativedelta_mod = _types.ModuleType('dateutil.relativedelta')
relativedelta_mod.relativedelta = MagicMock()
dateutil.relativedelta = relativedelta_mod
sys.modules.setdefault('dateutil', dateutil)
sys.modules.setdefault('dateutil.relativedelta', relativedelta_mod)

werkzeug_exceptions = _types.ModuleType('werkzeug.exceptions')
werkzeug_exceptions.BadRequest = type('BadRequest', (Exception,), {})
sys.modules.setdefault('werkzeug.exceptions', werkzeug_exceptions)


class AssetControllerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.prev_controllers = sys.modules.get('controllers')
        cls.prev_asset_controller = sys.modules.get('controllers.asset_controller')

        # Ensure our exception classes are used in case other tests modified them
        sys.modules['odoo.exceptions'] = odoo.exceptions

        controllers_pkg = types.ModuleType('controllers')
        controllers_pkg.__path__ = []
        sys.modules['controllers'] = controllers_pkg

        asset_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'asset_controller.py')
        spec = importlib.util.spec_from_file_location('controllers.asset_controller', asset_path)
        cls.asset_controller = importlib.util.module_from_spec(spec)
        sys.modules['controllers.asset_controller'] = cls.asset_controller
        spec.loader.exec_module(cls.asset_controller)
        controllers_pkg.asset_controller = cls.asset_controller

    @classmethod
    def tearDownClass(cls):
        if cls.prev_asset_controller is None:
            sys.modules.pop('controllers.asset_controller', None)
        else:
            sys.modules['controllers.asset_controller'] = cls.prev_asset_controller

        if cls.prev_controllers is None:
            sys.modules.pop('controllers', None)
        else:
            sys.modules['controllers'] = cls.prev_controllers

    def setUp(self):
        self.controller = self.asset_controller.PatrimoineAssetController()

    @patch('controllers.asset_controller.request')
    def test_create_mouvement_access_error_returns_403(self, mock_request):
        env = MagicMock()
        env.user.has_group.return_value = False
        mock_request.env = env
        mock_request.httprequest.data = '{}'

        res = self.controller.create_mouvement()
        self.assertEqual(res.status_code, 403)

    @patch('controllers.asset_controller.request')
    def test_create_mouvement_validation_error_returns_400(self, mock_request):
        env = MagicMock()
        env.user.has_group.return_value = True
        mock_request.env = env
        mock_request.httprequest.data = '{}'

        res = self.controller.create_mouvement()
        self.assertEqual(res.status_code, 400)


if __name__ == '__main__':
    unittest.main()

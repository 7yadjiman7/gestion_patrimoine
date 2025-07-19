import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import json
import types
import importlib.util

# On garde la version la plus complète pour simuler l'environnement Odoo
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
odoo._ = lambda x: x
sys.modules.setdefault("odoo", odoo)
sys.modules.setdefault("odoo.http", odoo.http)
sys.modules.setdefault("odoo.exceptions", odoo.exceptions)
sys.modules.setdefault("odoo.fields", odoo.fields)
sys.modules.setdefault("odoo.models", odoo.models)
sys.modules.setdefault("odoo.osv", odoo.osv)


# Simuler les dépendances externes
dateutil = types.ModuleType('dateutil')
relativedelta_mod = types.ModuleType('dateutil.relativedelta')
relativedelta_mod.relativedelta = MagicMock()
dateutil.relativedelta = relativedelta_mod
sys.modules.setdefault('dateutil', dateutil)
sys.modules.setdefault('dateutil.relativedelta', relativedelta_mod)

werkzeug_exceptions = types.ModuleType('werkzeug.exceptions')
werkzeug_exceptions.BadRequest = type('BadRequest', (Exception,), {})
sys.modules.setdefault('werkzeug.exceptions', werkzeug_exceptions)


# Charger le contrôleur à tester
controllers_pkg = types.ModuleType('controllers')
controllers_pkg.__path__ = []
sys.modules.setdefault('controllers', controllers_pkg)

common_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'common.py')
spec_common = importlib.util.spec_from_file_location('controllers.common', common_path)
common_module = importlib.util.module_from_spec(spec_common)
spec_common.loader.exec_module(common_module)
sys.modules['controllers.common'] = common_module
controllers_pkg.common = common_module

asset_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'asset_controller.py')
spec = importlib.util.spec_from_file_location('controllers.asset_controller', asset_path)
asset_controller = importlib.util.module_from_spec(spec)
spec.loader.exec_module(asset_controller)
sys.modules['controllers.asset_controller'] = asset_controller
controllers_pkg.asset_controller = asset_controller

class AssetControllerTest(unittest.TestCase):
    def setUp(self):
        self.controller = asset_controller.PatrimoineAssetController()

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

    @patch('controllers.asset_controller.request')
    def test_create_demande_missing_params_returns_400(self, mock_request):
        env = MagicMock()
        mock_request.env = env
        mock_request.env.user.has_group.return_value = True
        res = self.controller.create_demande(motif_demande=None, lignes=None)
        self.assertEqual(res.status_code, 400)

    @patch('controllers.asset_controller.request')
    def test_create_demande_unauthorized_returns_403(self, mock_request):
        env = MagicMock()
        mock_request.env = env
        mock_request.env.user.has_group.return_value = False
        res = self.controller.create_demande(motif_demande='m', lignes=[{'quantite':1,'demande_subcategory_id':1}])
        self.assertEqual(res.status_code, 403)

    @patch('controllers.asset_controller.request')
    def test_create_demande_success(self, mock_request):
        env = MagicMock()
        demande_model = MagicMock()
        ligne_model = MagicMock()
        env.__getitem__.side_effect = lambda model: demande_model if model == 'patrimoine.demande.materiel' else ligne_model
        demande_record = MagicMock(id=2)
        demande_model.create.return_value = demande_record
        ligne_model.create.return_value = MagicMock()
        mock_request.env = env
        mock_request.env.user.has_group.return_value = True
        mock_request.env.user.id = 7
        res = self.controller.create_demande(motif_demande='test', lignes=[{'demande_subcategory_id':1,'quantite':2}])
        demande_model.create.assert_called_with({'demandeur_id': 7, 'motif_demande': 'test'})
        ligne_model.create.assert_called_once()
        self.assertIsNone(res.status_code)
        args, kwargs = odoo.http.Response.call_args
        returned = json.loads(args[0])
        self.assertEqual(returned['demande_id'], demande_record.id)

    @patch('controllers.asset_controller.request')
    def test_pannes_unread_count(self, mock_request):
        env = MagicMock()
        panne_model = MagicMock()
        env.__getitem__.return_value = panne_model
        panne_model.sudo.return_value.search_count.return_value = 2
        mock_request.env = env
        mock_request.env.user.id = 7

        res = self.controller.pannes_unread_count()

        panne_model.sudo.return_value.search_count.assert_called_with([
            ('viewer_ids', 'not in', 7),
            ('manager_id.user_id', '=', 7),
            ('state', '=', 'to_approve'),
        ])
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.asset_controller.request')
    def test_pertes_unread_count(self, mock_request):
        env = MagicMock()
        perte_model = MagicMock()
        env.__getitem__.return_value = perte_model
        perte_model.sudo.return_value.search_count.return_value = 4
        mock_request.env = env
        mock_request.env.user.id = 9

        res = self.controller.pertes_unread_count()

        perte_model.sudo.return_value.search_count.assert_called_with([
            ('viewer_ids', 'not in', 9),
            ('manager_id.user_id', '=', 9),
            ('state', '=', 'to_approve'),
        ])
        self.assertIn('application/json', res.headers.get('Content-Type'))

    @patch('controllers.asset_controller.request')
    def test_create_demande_json_payload(self, mock_request):
        env = MagicMock()
        demande_model = MagicMock()
        ligne_model = MagicMock()
        env.__getitem__.side_effect = lambda model: demande_model if model == 'patrimoine.demande.materiel' else ligne_model
        demande_record = MagicMock(id=3)
        demande_model.create.return_value = demande_record
        ligne_model.create.return_value = MagicMock()
        mock_request.env = env
        mock_request.env.user.has_group.return_value = True
        mock_request.env.user.id = 9
        mock_request.jsonrequest = {
            'motif_demande': 'json',
            'lignes': [{'demande_subcategory_id': 1, 'quantite': 1}]
        }
        mock_request.httprequest = MagicMock(data=b'')

        res = self.controller.create_demande()

        demande_model.create.assert_called_with({'demandeur_id': 9, 'motif_demande': 'json'})
        ligne_model.create.assert_called_once()
        self.assertIsNone(res.status_code)
        args, kwargs = odoo.http.Response.call_args
        returned = json.loads(args[0])
        self.assertEqual(returned['demande_id'], demande_record.id)

if __name__ == '__main__':
    unittest.main()

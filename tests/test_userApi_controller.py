import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types

# Minimal odoo stubs for controller import
odoo = types.ModuleType("odoo")
odoo.http = types.SimpleNamespace(
    Controller=object,
    route=lambda *a, **k: (lambda f: f),
    request=MagicMock(),
)
sys.modules.setdefault("odoo", odoo)
sys.modules.setdefault("odoo.http", odoo.http)

import importlib.util

# Load the controller without executing the controllers package __init__
controllers_pkg = types.ModuleType('controllers')
controllers_pkg.__path__ = []
sys.modules.setdefault('controllers', controllers_pkg)

user_api_path = os.path.join(os.path.dirname(__file__), '..', 'controllers', 'userApi_controller.py')
spec = importlib.util.spec_from_file_location('controllers.userApi_controller', user_api_path)
user_api_controller = importlib.util.module_from_spec(spec)
sys.modules['controllers.userApi_controller'] = user_api_controller
spec.loader.exec_module(user_api_controller)
controllers_pkg.userApi_controller = user_api_controller


class UserApiControllerTest(unittest.TestCase):
    def setUp(self):
        self.controller = user_api_controller.UserApiController()

    @patch('controllers.userApi_controller.request')
    def test_get_user_info_with_employee(self, mock_request):
        env = MagicMock()
        employee_model = MagicMock()
        env.__getitem__.return_value = employee_model
        mock_request.env = env

        user = MagicMock(id=10, name='Test', login='test')
        user.has_group.side_effect = lambda g: g == 'gestion_patrimoine.group_patrimoine_admin'
        env.user = user

        employee = MagicMock()
        employee.department_id.id = 3
        employee.department_id.name = 'HR'
        employee_model.search.return_value = employee

        result = self.controller.get_user_info()

        employee_model.search.assert_called_with([('user_id', '=', user.id)], limit=1)
        self.assertEqual(result['uid'], user.id)
        self.assertEqual(result['name'], user.name)
        self.assertEqual(result['username'], user.login)
        self.assertEqual(result['roles'], ['admin_patrimoine'])
        self.assertEqual(result['department_id'], 3)
        self.assertEqual(result['department_name'], 'HR')

    @patch('controllers.userApi_controller.request')
    def test_get_user_info_without_employee(self, mock_request):
        env = MagicMock()
        employee_model = MagicMock()
        env.__getitem__.return_value = employee_model
        mock_request.env = env

        user = MagicMock(id=20, name='NoEmp', login='noemp')
        user.has_group.return_value = False
        env.user = user

        employee_model.search.return_value = False

        result = self.controller.get_user_info()

        employee_model.search.assert_called_with([('user_id', '=', user.id)], limit=1)
        self.assertEqual(result['uid'], user.id)
        self.assertEqual(result['name'], user.name)
        self.assertEqual(result['username'], user.login)
        self.assertEqual(result['roles'], ['user'])
        self.assertIsNone(result['department_id'])
        self.assertIsNone(result['department_name'])


if __name__ == '__main__':
    unittest.main()

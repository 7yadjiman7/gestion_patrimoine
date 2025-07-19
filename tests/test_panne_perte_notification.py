import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import types
import importlib.util

# Minimal stub of Odoo
odoo = types.ModuleType("odoo")
class BaseModel:
    @classmethod
    def create(cls, vals):
        return []
odoo.models = types.SimpleNamespace(Model=BaseModel)
odoo.fields = types.SimpleNamespace(
    Char=MagicMock(),
    Many2one=MagicMock(),
    Text=MagicMock(),
    Date=MagicMock(),
    Many2many=MagicMock(),
    Selection=MagicMock(),
    Datetime=MagicMock(),
    Integer=MagicMock(),
    Boolean=MagicMock(),
)
odoo.api = types.SimpleNamespace(
    model_create_multi=lambda f: f,
    depends=lambda *a: (lambda f: f),
    model=lambda f: f,
)
odoo._ = lambda x: x
sys.modules['odoo'] = odoo
sys.modules['odoo.models'] = odoo.models
sys.modules['odoo.fields'] = odoo.fields
sys.modules['odoo.api'] = odoo.api
odoo.exceptions = types.SimpleNamespace(
    UserError=type('UserError', (Exception,), {}),
    AccessError=type('AccessError', (Exception,), {}),
    ValidationError=type('ValidationError', (Exception,), {}),
)
ex_mod = sys.modules.setdefault('odoo.exceptions', odoo.exceptions)
for attr in ['UserError', 'AccessError', 'ValidationError']:
    if not hasattr(ex_mod, attr):
        setattr(ex_mod, attr, getattr(odoo.exceptions, attr))

# Load panne model
panne_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'panne.py')
spec_panne = importlib.util.spec_from_file_location('models.panne', panne_path)
panne = importlib.util.module_from_spec(spec_panne)
spec_panne.loader.exec_module(panne)
sys.modules['models.panne'] = panne

# Load perte model
perte_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'pertes.py')
spec_perte = importlib.util.spec_from_file_location('models.pertes', perte_path)
perte = importlib.util.module_from_spec(spec_perte)
spec_perte.loader.exec_module(perte)
sys.modules['models.pertes'] = perte

models_pkg = types.ModuleType('models')
models_pkg.panne = panne
models_pkg.pertes = perte
panne.models = types.SimpleNamespace(Model=odoo.models.Model)
perte.models = types.SimpleNamespace(Model=odoo.models.Model)
sys.modules.setdefault('models', models_pkg)

class PannePerteNotificationTest(unittest.TestCase):
    def test_panne_create_notifies_manager(self):
        fake_env = MagicMock()
        fake_bus = MagicMock()
        fake_env.__getitem__.return_value = fake_bus
        fake_record = MagicMock()
        fake_record.id = 1
        fake_record.asset_id.name = 'A'
        fake_record.description = 'desc'
        fake_record.manager_id.user_id.partner_id = MagicMock()
        FakeSelf = type('FakeSelf', (panne.PatrimoinePanne,), {})
        fake_self = FakeSelf()
        fake_self.env = fake_env
        fake_self._cr = MagicMock(dbname='x')
        with patch('models.panne.models.Model.create', return_value=fake_record):
            panne.PatrimoinePanne.create(fake_self, {'asset_id': 1})
        fake_bus.sendmany.assert_called_once()
        args, _ = fake_bus.sendmany.call_args
        self.assertEqual(args[0][0][1]['type'], 'new_panne')

    def test_perte_create_notifies_manager_and_director(self):
        fake_env = MagicMock()
        fake_bus = MagicMock()
        fake_env.__getitem__.return_value = fake_bus
        fake_record = MagicMock()
        fake_record.id = 2
        fake_record.asset_id.name = 'B'
        fake_record.motif = 'm'
        fake_record.manager_id.user_id.partner_id = MagicMock()
        dept_partner = MagicMock()
        fake_employee = MagicMock()
        fake_employee.department_id.manager_id.user_id.partner_id = dept_partner
        fake_employees = MagicMock()
        fake_employees.__getitem__.return_value = fake_employee
        fake_record.declarer_par_id.employee_ids = fake_employees
        FakeSelf = type('FakeSelf', (perte.PatrimoinePerte,), {})
        fake_self = FakeSelf()
        fake_self.env = fake_env
        fake_self._cr = MagicMock(dbname='y')
        with patch('models.pertes.models.Model.create', return_value=fake_record):
            perte.PatrimoinePerte.create(fake_self, {'asset_id': 1})
        fake_bus.sendmany.assert_called_once()
        args, _ = fake_bus.sendmany.call_args
        self.assertEqual(args[0][0][1]['type'], 'new_perte')

if __name__ == '__main__':
    unittest.main()

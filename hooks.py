from odoo import api, SUPERUSER_ID


def _link_admin_group(env):
    """Ensure XML ID for the admin group exists."""
    category = None
    try:
        category = env.ref('gestion_patrimoine.module_category_patrimoine', raise_if_not_found=False)
    except Exception:
        category = None
    if not category:
        category = env['ir.module.category'].search([('name', '=', 'Patrimoine')], limit=1)
    domain = [('name', '=', 'Administrateur Patrimoine')]
    if category:
        domain.append(('category_id', '=', category.id))
    group = env['res.groups'].search(domain, limit=1)
    if group and not env['ir.model.data'].search([
        ('model', '=', 'res.groups'),
        ('module', '=', 'gestion_patrimoine'),
        ('name', '=', 'group_patrimoine_admin')
    ]):
        env['ir.model.data'].create({
            'name': 'group_patrimoine_admin',
            'model': 'res.groups',
            'module': 'gestion_patrimoine',
            'res_id': group.id,
            'noupdate': True,
        })


def pre_init_hook(cr):
    """Link existing admin group by name if present."""
    # env = api.Environment(cr, SUPERUSER_ID, {})
    # _link_admin_group(env)
    # If not found, data loading will create the group normally


def post_init_hook(env):
    """Ensure XML ID exists when upgrading the module."""
    _link_admin_group(env)


from odoo import models, fields

class PatrimoineAsset(models.Model):
    _name = 'patrimoine.asset'
    _description = 'Bien patrimonial'
    _inherit = ['mail.thread']

    name = fields.Char(string="Nom du bien", required=True, tracking=True)
    code = fields.Char(string="Référence interne", required=True)
    type = fields.Selection([
        ('vehicule', 'Véhicule'),
        ('informatique', 'Informatique'),
        ('mobilier', 'Mobilier'),
    ], string="Type", required=True)
    categorie_id = fields.Many2one('patrimoine.categorie', string="Catégorie")
    date_acquisition = fields.Date(string="Date d'acquisition")
    valeur_acquisition = fields.Float(string="Valeur")
    etat = fields.Selection([
        ('service', 'En service'),
        ('hs', 'Hors service'),
        ('reforme', 'Réformé'),
    ], string="État", default="service")
    department_id = fields.Many2one('hr.department', string="Département")
    employee_id = fields.Many2one('hr.employee', string="Employé affecté")
    location_id = fields.Many2one('stock.location', string="Localisation")
    # account_asset_id = fields.Many2one('account.asset.asset', string="Immobilisation comptable")


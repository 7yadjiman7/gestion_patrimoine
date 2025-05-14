from odoo import models, fields

class PatrimoineCategorie(models.Model):
    _name = 'patrimoine.categorie'
    _description = 'Catégorie de Bien Patrimonial'

    name = fields.Char(string='Nom', required=True)
    code = fields.Char(string='Code', required=True)
    # account_category_id = fields.Many2one('account.asset.category', string="Catégorie d'amortissement")

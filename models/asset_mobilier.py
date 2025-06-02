from odoo import models, fields

class PatrimoineAssetMobilier(models.Model):
    _name = 'patrimoine.asset.mobilier'
    _description = 'Détails Mobilier'
    _inherits = {'patrimoine.asset': 'asset_id'}

    asset_id = fields.Many2one('patrimoine.asset', string="Nom du bien")
    categorie_mobilier = fields.Selection([
        ('Table', 'Table'),
        ('chaise', 'Chaise'),
        ('Placard', 'Placard'),
    ], string="Catégorie de mobilier")
    etat_conservation = fields.Selection([
        ('bon', 'Bon'),
        ('moyen', 'Moyen'),
        ('mauvais', 'Mauvais'),
    ], string="État de conservation")



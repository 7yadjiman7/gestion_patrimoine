from odoo import models, fields

class PatrimoineAssetMobilier(models.Model):
    _name = 'patrimoine.asset.mobilier'
    _description = 'Détails Mobilier'

    asset_id = fields.Many2one('patrimoine.asset', string="Bien principal")
    type_mobilier = fields.Selection([
        ('bureau', 'Bureau'),
        ('chaise', 'Chaise'),
        ('armoire', 'Armoire'),
    ], string="Type de mobilier")
    etat_conservation = fields.Selection([
        ('bon', 'Bon'),
        ('moyen', 'Moyen'),
        ('mauvais', 'Mauvais'),
    ], string="État de conservation")


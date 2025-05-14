from odoo import models, fields

class PatrimoineAssetInformatique(models.Model):
    _name = 'patrimoine.asset.informatique'
    _description = 'Détails Informatique'

    asset_id = fields.Many2one('patrimoine.asset', string="Bien principal")
    type_materiel = fields.Selection([
        ('ordinateur', 'Ordinateur'),
        ('imprimante', 'Imprimante'),
        ('serveur', 'Serveur'),
    ], string="Type de matériel")
    marque = fields.Char("Marque")
    modele = fields.Char("Modèle")
    numero_serie = fields.Char("Numéro de série")
    date_garantie_fin = fields.Date("Fin de garantie")
    fournisseur = fields.Char("Fournisseur")


from odoo import models, fields, api
from datetime import timedelta

class PatrimoineAssetInformatique(models.Model):
    _name = 'patrimoine.asset.informatique'
    _description = 'Détails Informatique'
    _inherits = {'patrimoine.asset': 'asset_id'}


    asset_id = fields.Many2one('patrimoine.asset', string="Nom du bien")
    categorie_materiel = fields.Selection([
        ('ordinateur', 'Ordinateur'),
        ('imprimante', 'Imprimante'),
        ('Clavier', 'Clavier'),
        ('Autre', 'Autre catégorie')
    ], string="Catégorie de matériel informatique")
    marque = fields.Char("Marque")
    modele = fields.Char("Modèle")
    numero_serie = fields.Char("Numéro de série")
    date_garantie_fin = fields.Date("Fin de garantie")
    fournisseur = fields.Char("Fournisseur")


    @api.model
    def check_warranty_expiry(self):
        today = fields.Date.today()
        seuil = today + timedelta(days=15)

        expirants = self.search([
            ('date_garantie_fin', '!=', False),
            ('date_garantie_fin', '<=', seuil)
        ])

        for asset in expirants:
            asset.asset_id.message_post(
                body=f"🛑 La garantie de {asset.asset_id.name} expire bientôt : {asset.date_garantie_fin}",
                subject="Fin de garantie proche",
            )


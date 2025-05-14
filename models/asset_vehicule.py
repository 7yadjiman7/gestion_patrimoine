from odoo import models, fields

class PatrimoineAssetVehicule(models.Model):
    _name = 'patrimoine.asset.vehicule'
    _description = 'Détails Véhicule'

    asset_id = fields.Many2one('patrimoine.asset', string="Bien principal")
    immatriculation = fields.Char("Immatriculation")
    marque = fields.Char("Marque")
    modele = fields.Char("Modèle")
    kilometrage = fields.Float("Kilométrage actuel")
    date_achat = fields.Date("Date d'achat")
    date_premiere_circulation = fields.Date("Première mise en circulation")
    date_assurance = fields.Date("Expiration assurance")
    date_controle_technique = fields.Date("Prochain contrôle technique")
    kilometrage_precedent = fields.Float("Kilométrage précédent")


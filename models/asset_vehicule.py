from odoo import models, fields, api
from datetime import timedelta

class PatrimoineAssetVehicule(models.Model):
    _name = 'patrimoine.asset.vehicule'
    _description = 'Détails Véhicule'
    _inherits = {'patrimoine.asset': 'asset_id'}

    asset_id = fields.Many2one('patrimoine.asset', string="Nom du bien")
    immatriculation = fields.Char("Immatriculation")
    marque = fields.Char("Marque")
    modele = fields.Char("Modèle")
    kilometrage = fields.Float("Kilométrage actuel")
    date_achat = fields.Date("Date d'achat")
    date_premiere_circulation = fields.Date("Première mise en circulation")
    date_assurance = fields.Date("Expiration assurance")
    date_controle_technique = fields.Date("Prochain contrôle technique")
    kilometrage_precedent = fields.Float("Kilométrage précédent")

    @api.model
    def check_vehicule_alerts(self):
        today = fields.Date.today()
        seuil = today + timedelta(days=15)

        vehicles = self.search([
            '|',
            ('date_controle_technique', '<=', seuil),
            ('date_assurance', '<=', seuil),
        ])

        for vehicle in vehicles:
            alerts = []
            if vehicle.date_controle_technique and vehicle.date_controle_technique <= seuil:
                alerts.append(f"🚗 Contrôle technique avant le {vehicle.date_controle_technique}")
            if vehicle.date_assurance and vehicle.date_assurance <= seuil:
                alerts.append(f"🛡️ Assurance expire le {vehicle.date_assurance}")

            if alerts:
                vehicle.asset_id.message_post(
                    body="<br/>".join(alerts),
                    subject="Alerte véhicule",
                )

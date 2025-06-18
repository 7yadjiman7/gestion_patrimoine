from odoo import models, fields, api
from datetime import timedelta, date
class PatrimoineEntretien(models.Model):
    _name = 'patrimoine.entretien'
    _description = 'Entretien de Bien'

    asset_id = fields.Many2one('patrimoine.asset', string='Bien concerné')
    demande_id = fields.Many2one('patrimoine.demande.materiel', string='Demande associée')
    date_intervention = fields.Date(string="Date d'intervention", required=True)
    type_entretien = fields.Selection([
        ('preventif', 'Préventif'),
        ('correctif', 'Correctif'),
    ], string="Type d'entretien")
    prochain_rappel = fields.Date(string='Prochain rappel')
    description = fields.Text(string='Description')
    cout = fields.Float(string='Coût')
    prestataire = fields.Char(string='Prestataire')
    etat = fields.Selection([
        ('planifie', 'Planifié'),
        ('effectue', 'Effectué'),
    ], string='État')


    @api.model
    def check_upcoming_entretiens(self):
        today = date.today()
        seuil = today + timedelta(days=7)

        entretiens = self.search([
            ('prochain_rappel', '!=', False),
            ('prochain_rappel', '<=', seuil),
            ('etat', '=', 'planifie')
        ])

        for entretien in entretiens:
            # Exemple simple d'alerte : log ou notification
            entretien.message_post(
                body=f"📅 Rappel : entretien prévu le {entretien.prochain_rappel} pour {entretien.asset_id.name}.",
                subject="Rappel d'entretien",
            )
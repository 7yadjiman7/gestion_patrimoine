from odoo import models, fields

class PatrimoineEntretien(models.Model):
    _name = 'patrimoine.entretien'
    _description = 'Entretien de Bien'

    asset_id = fields.Many2one('patrimoine.asset', string='Bien concerné')
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

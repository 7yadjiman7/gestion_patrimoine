# patrimoine/models/fiche_vie.py
from odoo import models, fields, api

class PatrimoineFicheVie(models.Model):
    _name = 'patrimoine.fiche.vie'
    _description = "Fiche de vie d’un matériel"
    _order = 'date desc, id desc'

    asset_id = fields.Many2one('patrimoine.asset', string="Matériel concerné", required=True)
    # Ajout d'un champ related pour le nom du matériel, utile pour la recherche et le rapport
    asset_name = fields.Char(related='asset_id.name', string="Nom du matériel", store=True)
    asset_code = fields.Char(related='asset_id.code', string="Code du matériel", store=True)

    date = fields.Datetime(string="Date de l’action", default=fields.Datetime.now)
    action = fields.Selection([
        ('creation', 'Création'),
        ('affectation', 'Affectation / Mise en service'),
        ('transfert', 'Transfert'),
        ('reparation', 'Réparation / Maintenance'),
        ('amortissement', 'Amortissement'),
        ('sortie', 'Sortie temporaire / Hors service'),
        ('reforme', 'Réforme / Mise au rebut'),
        ('retour_stock', 'Retour en stock'),
        ('autre', 'Autre'),
    ], string="Type d’action", required=True)
    description = fields.Text(string="Détails")
    utilisateur_id = fields.Many2one('res.users', string="Utilisateur", default=lambda self: self.env.user)
    # Ajout d'un champ related pour le nom de l'utilisateur, utile pour le rapport
    utilisateur_name = fields.Char(related='utilisateur_id.name', string="Utilisateur de l'action", store=True)

    mouvement_id = fields.Many2one('patrimoine.mouvement', string="Mouvement associé")

    # Vous pouvez également ajouter un champ pour le statut final de l'asset après cette action
    # final_asset_status = fields.Selection(related='asset_id.etat', string="Statut final du bien", store=True)

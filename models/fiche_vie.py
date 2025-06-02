from odoo import models, fields

class PatrimoineFicheVie(models.Model):
    _name = 'patrimoine.fiche.vie'
    _description = "Fiche de vie d’un matériel"
    _order = 'date desc, id desc' # Ajout d'un ordre pour l'historique

    asset_id = fields.Many2one('patrimoine.asset', string="Matériel concerné", required=True)
    date = fields.Datetime(string="Date de l’action", default=fields.Datetime.now)
    action = fields.Selection([
        ('creation', 'Création'), # Peut être appelé lors de la création initiale du bien
        ('affectation', 'Affectation / Mise en service'), # Correspond à 'affectation'
        ('transfert', 'Transfert'), # Correspond à 'transfert'
        ('reparation', 'Réparation / Maintenance'), # Nouvelle action possible
        ('amortissement', 'Amortissement'), # Nouvelle action possible
        ('sortie', 'Sortie temporaire / Hors service'), # Correspond à 'sortie'
        ('reforme', 'Réforme / Mise au rebut'), # Correspond à 'reforme'
        ('retour_stock', 'Retour en stock'), # Si vous avez un mouvement de retour
        ('autre', 'Autre'),
    ], string="Type d’action", required=True)
    description = fields.Text(string="Détails")
    utilisateur_id = fields.Many2one('res.users', string="Utilisateur", default=lambda self: self.env.user)

    # Vous pouvez ajouter un champ optionnel pour lier à un mouvement spécifique
    mouvement_id = fields.Many2one('patrimoine.mouvement', string="Mouvement associé")

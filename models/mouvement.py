from odoo import models, fields

class PatrimoineMouvement(models.Model):
    _name = 'patrimoine.mouvement'
    _description = 'Mouvement de Bien'

    asset_id = fields.Many2one('patrimoine.asset', string="Bien")
    date = fields.Date(string="Date", required=True)
    type_mouvement = fields.Selection([
        ('transfert', 'Transfert'),
        ('reforme', 'Réforme'),
        ('sortie', 'Sortie')
    ], string="Type", required=True)
    from_department_id = fields.Many2one('hr.department', string="Département source")
    to_department_id = fields.Many2one('hr.department', string="Département cible")
    motif = fields.Text(string="Motif")
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('valide', 'Validé')
    ], string="État", default='draft')

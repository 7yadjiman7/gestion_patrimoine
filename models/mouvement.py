# gestion_patrimoine/models/mouvement.py (Version Corrigée)
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import logging
_logger = logging.getLogger(__name__)

class PatrimoineMouvement(models.Model):
    _name = 'patrimoine.mouvement'
    _description = 'Mouvement de Bien'
    _inherit = ['mail.thread', 'mail.activity.mixin'] # Ajout mail.activity.mixin
    _order = 'date desc, id desc'

    name = fields.Char(string="Référence", required=True, copy=False, readonly=True,
                       default=lambda self: self.env['ir.sequence'].next_by_code('patrimoine.mouvement.code'))
    asset_id = fields.Many2one('patrimoine.asset', string="Bien concerné", required=True, tracking=True)

    date = fields.Date(string="Date du mouvement", required=True, default=fields.Date.context_today)
    type_mouvement = fields.Selection([
        ('affectation', 'Affectation'),
        ('transfert', 'Transfert'),
        ('reparation', 'Réparation / Maintenance'),
        ('amortissement', 'Amortissement'),
        ('sortie', 'Sortie définitive'),
    ], string="Type de mouvement", required=True, tracking=True)

    from_location_id = fields.Many2one('stock.location', string="Localisation source", related='asset_id.location_id', readonly=True, store=True)
    from_employee_id = fields.Many2one('hr.employee', string='Employé source', tracking=True) # <-- AJOUTÉ AU MODÈLE

    to_department_id = fields.Many2one('hr.department', string="Département destination", tracking=True)
    to_employee_id = fields.Many2one('hr.employee', string="Employé destination", tracking=True)
    to_location_id = fields.Many2one('stock.location', string="Localisation destination", tracking=True)

    motif = fields.Text(string="Motif du mouvement", tracking=True) # Champ 'motif' du modèle

    state = fields.Selection([
        ('draft', 'Brouillon'), # État initial après création par le gestionnaire
        ('valide', 'Validé')    # État après que le gestionnaire a confirmé l'action (pas de validation externe)
    ], string="État", default='draft', tracking=True)

    @api.model
    def create(self, vals):
        if vals.get('name', '/') == '/':
            vals['name'] = self.env['ir.sequence'].next_by_code('patrimoine.mouvement.code') or 'Nouvelle Référence'
        record = super(PatrimoineMouvement, self).create(vals)
        # La validation/mise à jour de l'asset peut être appelée ici si le mouvement est validé automatiquement
        # record.action_valider() # Si vous voulez validation auto
        return record

    def action_valider(self): # Renommée pour action_valider pour correspondre à votre fichier
        self.ensure_one()
        if self.state == 'valide': # Si déjà validé, lever une erreur
            raise ValidationError("Ce mouvement a déjà été validé.")

        # Logique de mise à jour de l'asset (depuis votre précédent mouvement.py)
        # Assurez-vous que le code est complet et correct.
        asset = self.asset_id
        if self.type_mouvement == 'affectation':
            asset.write({
                'department_id': self.to_department_id.id,
                'employee_id': self.to_employee_id.id,
                'location_id': self.to_location_id.id,
                'etat': 'service'
            })
        elif self.type_mouvement == 'transfert':
            asset.write({
                'department_id': self.to_department_id.id,
                'employee_id': self.to_employee_id.id,
                'location_id': self.to_location_id.id,
            })
        elif self.type_mouvement == 'sortie':
            asset.write({
                'department_id': False,
                'employee_id': False,
                'location_id': False,
                'etat': 'hs'
            })
        elif self.type_mouvement == 'reforme':
            asset.write({
                'etat': 'reforme',
                'location_id': False,
                'employee_id': False
            })
        elif self.type_mouvement == 'retour_stock':
            asset.write({
                'location_id': self.to_location_id.id if self.to_location_id else False,
                'employee_id': False,
                'etat': 'stock'
            })

        self.state = 'valide' # Mettre le statut du mouvement à 'valide'

        # Création de la fiche de vie (depuis votre précédent mouvement.py)
        request.env['patrimoine.fiche.vie'].create({
            'asset_id': self.asset_id.id,
            'action': self.type_mouvement,
            'description': f"Mouvement de type '{dict(self._fields['type_mouvement'].selection).get(self.type_mouvement)}' validé. Motif: {self.motif or 'N/A'}",
            'utilisateur_id': request.env.user.id,
            'mouvement_id': self.id,
        })
        return True

    def action_cancel(self): # Si vous voulez une action d'annulation
        self.write({'state': 'draft'}) # Ou 'annule'
        return True

    # Contraintes de validation
    @api.constrains('type_mouvement', 'to_employee_id', 'to_department_id', 'to_location_id', 'from_employee_id', 'from_location_id')
    def _check_destination_fields(self):
        for record in self:
            if record.type_mouvement == 'affectation':
                if not record.to_employee_id:
                    raise ValidationError("L'employé destinataire est obligatoire pour une affectation.")
                if not (record.to_department_id or record.to_location_id):
                    raise ValidationError("Au moins un champ de destination (Département ou Localisation) doit être renseigné pour une affectation.")
            elif record.type_mouvement == 'transfert':
                # Pour le transfert, si le bien est affecté, l'employé source et/ou la localisation source sont pertinents
                # et les destinations aussi.
                if not (record.to_department_id or record.to_employee_id or record.to_location_id):
                    raise ValidationError("Au moins un champ de destination (Département, Employé ou Localisation) doit être renseigné pour un transfert.")
            elif record.type_mouvement == 'sortie':
                if record.to_department_id or record.to_employee_id or record.to_location_id:
                    raise ValidationError("Les champs de destination doivent être vides pour une sortie définitive.")
            # Pour 'reparation', 'amortissement', 'retour_stock', ajoutez des contraintes si nécessaire

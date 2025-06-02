from odoo import models, fields, api
from odoo.exceptions import ValidationError
import logging
_logger = logging.getLogger(__name__)

class PatrimoineMouvement(models.Model):
    _name = 'patrimoine.mouvement'
    _description = 'Mouvement de Bien'
    _inherit = ['mail.thread']
   

    name = fields.Char(string="Référence", readonly=True, copy=False, default='/')
    asset_id = fields.Many2one('patrimoine.asset', string="Bien concerné", required=True, tracking=True)

    date = fields.Date(string="Date du mouvement", required=True, default=fields.Date.context_today)
    type_mouvement = fields.Selection([
        ('affectation', 'Affectation'),
        ('transfert', 'Transfert'),
        ('reparation', 'Réparation / Maintenance'), 
        ('amortissement', 'Amortissement'),
        ('sortie', 'Sortie définitive'),
    ], string="Type de mouvement", required=True, tracking=True)

    # Origine (peut être déduit du bien si vous ne voulez pas les stocker explicitement ici)
    from_location_id = fields.Many2one('stock.location', string="Localisation source",
                                       related='asset_id.location_id', readonly=True)     # Lecture seule, vient du bien

    # Destination (ces champs seront renseignés par l'utilisateur lors du mouvement)
    to_department_id = fields.Many2one('hr.department', string="Département destination")
    to_employee_id = fields.Many2one('hr.employee', string="Employé destination")
    to_location_id = fields.Many2one('stock.location', string="Localisation destination")

    motif = fields.Text(string="Motif du mouvement")
    
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('valide', 'Validé')
    ], string="État", default='draft', tracking=True)

    @api.model
    def create(self, vals):
        if vals.get('name', '/') == '/':
            vals['name'] = self.env['ir.sequence'].next_by_code('patrimoine.mouvement.code') or 'Nouveau Mouvement'
        return super(PatrimoineMouvement, self).create(vals)

    def action_valider(self):
        _logger.info(f"Appel de action_valider pour le mouvement {self.name} (ID: {self.id})")
        for record in self:
            _logger.info(f"Traitement du mouvement {record.name} (ID: {record.id})")
            if record.state == 'valide':
                _logger.warning(f"Mouvement {record.name} déjà validé. Ignoré.")
                raise ValidationError("Ce mouvement a déjà été validé.")

            asset = record.asset_id
            _logger.info(f"Bien concerné: {asset.name} (ID: {asset.id}), État actuel: {asset.etat}")

            # Validation du statut du bien avant le mouvement
            if record.type_mouvement == 'affectation' and asset.etat != 'stock':
                _logger.error(f"Erreur: Affectation du bien {asset.name} (état {asset.etat}) alors qu'il n'est pas en stock.")
                raise ValidationError("Un bien doit être en 'En stock' pour pouvoir être affecté.")
            if record.type_mouvement == 'transfert' and asset.etat not in ('service', 'hs'):
                raise ValidationError("Un bien doit être 'En service' ou 'Hors service' pour être transféré.")


            # Mise à jour des données du bien (affectation, transfert, sortie)
            if record.type_mouvement == 'affectation':
                # Mettre à jour les champs du bien avec les données de destination du mouvement
                _logger.info(f"Type de mouvement: Affectation. Mise à jour du bien {asset.name}.")
                asset.write({
                    'department_id': record.to_department_id.id,
                    'employee_id': record.to_employee_id.id,
                    'location_id': record.to_location_id.id,
                    'etat': 'service' # Le bien est maintenant en service
                })
                _logger.info(f"Bien {asset.name} mis à jour. Nouvel état: {asset.etat}, Nouveau département: {asset.department_id.name if asset.department_id else 'N/A'}")
                _logger.info(f"Le champ 'code' du bien devrait se recalculer maintenant. Ancien code: {asset.initial_code}, Nouveau code attendu: {asset.code}") # Note: asset.code sera le code calculé APRES write                                                                                                                              # donc pour comparer, il faut avoir l'ancien.
                # Le code du bien sera recalculé automatiquement ici grâce au @api.depends

            elif record.type_mouvement == 'transfert':
                asset.write({
                    'department_id': record.to_department_id.id,
                    'employee_id': record.to_employee_id.id, # L'employé peut changer ou rester le même
                    'location_id': record.to_location_id.id,
                })

            elif record.type_mouvement == 'sortie':
                asset.write({
                    'department_id': False, # Le bien n'est plus dans un département
                    'employee_id': False,   # Le bien n'est plus affecté à un employé
                    'location_id': False,   # Le bien n'est plus dans une localisation spécifique
                    'etat': 'hs'            # Hors service
                })
            
            record.state = 'valide' # Mettre à jour l'état du mouvement en dernier
            _logger.info(f"Mouvement {record.name} validé.")


             # --- Création des entrées dans la Fiche de Vie ---
            try:
                user_id = self.env.user.id if self.env.user else False
                
                # Enregistrement du mouvement dans la fiche de vie
                action_value = record.type_mouvement # Utilise la clé technique du type de mouvement
                
                # Cas particulier pour la "mise en service" (affectation)
                if record.type_mouvement == 'affectation':
                    _logger.info(f"Création d'entrée de fiche de vie pour Affectation/Mise en service.")
                    self.env['patrimoine.fiche.vie'].create({
                        'asset_id': asset.id,
                        'date': record.date, # Utilise la date du mouvement
                        'action': 'affectation', # Ou 'mise_en_service' si vous l'ajoutez dans le Selection de fiche.vie
                        'description': f"Mise en service du bien. Affecté à {asset.employee_id.name or ''} ({asset.department_id.name or ''}) à {asset.location_id.name or ''}. Motif: {record.motif or 'Néant'}.",
                        'utilisateur_id': user_id,
                        'mouvement_id': record.id # Optionnel
                    })
                elif record.type_mouvement == 'sortie':
                    _logger.info(f"Création d'entrée de fiche de vie pour Sortie/Hors service.")
                    self.env['patrimoine.fiche.vie'].create({
                        'asset_id': asset.id,
                        'date': record.date,
                        'action': 'sortie', # Correspond au type_mouvement 'sortie'
                        'description': f"Mise hors service du bien. Motif: {record.motif or 'Néant'}.",
                        'utilisateur_id': user_id,
                    })
                else:
                    # Pour les autres types de mouvement (transfert, réforme, etc.)
                    _logger.info(f"Création d'entrée de fiche de vie pour type de mouvement: {action_value}.")
                    self.env['patrimoine.fiche.vie'].create({
                        'asset_id': asset.id,
                        'date': record.date,
                        'action': action_value, # Utilisez directement la clé du type de mouvement
                        'description': f"Action: {dict(record._fields['type_mouvement'].selection).get(action_value)}. Détails: {record.motif or 'Néant'}.",
                        'utilisateur_id': user_id,
                    })

                _logger.info(f"Fiche de vie créée pour le bien {asset.id}.")
            except Exception as e:
                _logger.error(f"Erreur lors de la création de la fiche de vie pour mouvement {record.id}: {e}")


        _logger.info(f"--- Fin action_valider pour mouvement {self.id} ---")

    @api.constrains('type_mouvement', 'to_employee_id', 'to_department_id', 'to_location_id')
    def _check_destination_fields(self):
        for record in self:
            if record.type_mouvement in ('affectation', 'transfert'):
                # Pour l'affectation, l'employé est obligatoire
                if record.type_mouvement == 'affectation' and not record.to_employee_id:
                    raise ValidationError("L'employé destinataire est obligatoire pour une affectation.")
                # Pour les deux, au moins un champ de destination doit être renseigné
                if not record.to_department_id and not record.to_employee_id and not record.to_location_id:
                    raise ValidationError("Au moins un champ de destination (Département, Employé ou Localisation) doit être renseigné pour une affectation ou un transfert.")
            elif record.type_mouvement == 'sortie':
                # S'assurer que les champs de destination sont vides pour les sorties/réformes
                if record.to_department_id or record.to_employee_id or record.to_location_id:
                    raise ValidationError("Les champs de destination doivent être vides pour une sortie ou une réforme.")


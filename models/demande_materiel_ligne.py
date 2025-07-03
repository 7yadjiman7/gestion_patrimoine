# gestion_patrimoine/models/demande_materiel_ligne.py
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class PatrimoineDemandeMaterielLigne(models.Model):
    _name = 'patrimoine.demande.materiel.ligne'
    _description = 'Ligne de Demande de Matériel'

    demande_id = fields.Many2one(
        'patrimoine.demande.materiel',
        string='Demande',
        required=True,
        ondelete='cascade' # Si la demande est supprimée, les lignes le sont aussi
    )

    # Type de matériel demandé pour cette ligne
    demande_subcategory_id = fields.Many2one(
        'asset.subcategory',
        string='Matériel Demandé',
        required=True
    )

    # Destination spécifique à CETTE ligne
    destinataire_department_id = fields.Many2one(  # Département qui fait la demande
        "hr.department", string="Département Destinataire", tracking=True
    )
    destinataire_location_id = fields.Many2one(
        'stock.location',
        string='Bureau/Localisation Destinataire'
    )
    destinataire_employee_id = fields.Many2one(
        'hr.employee',
        string='Employé Destinataire'
    )

    quantite = fields.Integer(
        string="Quantité",
        required=True,
        default=1
    )
    
    description = fields.Text(string="Notes pour cette ligne")

    @api.constrains('quantite')
    def _check_quantite_positive(self):
        for record in self:
            if record.quantite <= 0:
                raise ValidationError("La quantité doit être un nombre positif.")

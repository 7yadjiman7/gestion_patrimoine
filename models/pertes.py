# gestion_patrimoine/models/perte.py (Version Corrigée)
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)


class PatrimoineDeclarationPerte(models.Model):
    _name = "patrimoine.perte"
    _description = "Déclaration de perte de Matériel"
    _inherit = [
        "mail.thread",
        "mail.activity.mixin",
    ]  # Ajouté pour le chatter et notifications
    _order = "date desc"

    name = fields.Char(
        string="Référence Déclaration",
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self.env["ir.sequence"].next_by_code(
            "patrimoine.perte.code"
        ),
    )  # Séquence à définir

    asset_id = fields.Many2one(
        "patrimoine.asset", string="Bien concerné", required=True, tracking=True
    )

    date = fields.Datetime(
        string="Date de la déclaration",
        required=True,
        default=fields.Datetime.now,
        tracking=True,
    )  # Datetime pour cohérence avec les autres dates
    motif = fields.Text(string="Motif de la perte", tracking=True)
    declarer_par_id = fields.Many2one(
        "res.users",
        string="Déclaré par",
        default=lambda self: self.env.user,
        readonly=True,
        tracking=True,
    )  # Renommé

    state = fields.Selection(
        [  # Statuts harmonisés pour le workflow
            ("pending", "En attente de validation"),  # Brouillon
            ("confirmed", "Confirmée"),  # Approuvée
            ("rejected", "Rejetée"),  # Refusée
            ("processed", "Traitée"),  # Si le matériel est mis au rebut ou remplacé
        ],
        string="Statut",
        default="pending",
        tracking=True,
    )  # Statut par défaut 'pending'

    # Méthodes d'action pour le workflow
    def action_confirm(self):  # Remplace action_confirmer
        self.ensure_one()
        if self.state == "pending":
            self.write({"state": "confirmed"})
            # self.asset_id.write({'etat': 'hs'}) # Optionnel: Mettre l'asset hors service/réformé
            return True
        raise ValidationError(
            "La déclaration doit être en statut 'En attente de validation' pour être confirmée."
        )

    def action_reject(self):
        self.ensure_one()
        if self.state == "pending":
            self.write({"state": "rejected"})
            return True
        raise ValidationError(
            "La déclaration doit être en statut 'En attente de validation' pour être rejetée."
        )

    def action_process(self):  # Action pour marquer comme 'traitée' après confirmation
        self.ensure_one()
        if self.state == "confirmed":
            self.write({"state": "processed"})
            return True
        raise ValidationError("La déclaration doit être 'Confirmée' pour être traitée.")

    @api.model
    def create(self, vals):
        if vals.get("name", "/") == "/":
            vals["name"] = (
                self.env["ir.sequence"].next_by_code("patrimoine.perte.code")
                or "Nouvelle Déclaration"
            )
        return super(PatrimoineDeclarationPerte, self).create(vals)

    # Assurez-vous d'ajouter cette séquence dans sequence.xml

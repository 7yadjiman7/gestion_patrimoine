# gestion_patrimoine/models/demande_materiel.py (MODIFIÉ)
from odoo import models, fields, api


class PatrimoineDemandeMateriel(models.Model):
    _name = "patrimoine.demande.materiel"
    _description = "Demande de Matériel par les Directeurs"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc"

    name = fields.Char(
        string="Référence Demande",
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self.env["ir.sequence"].next_by_code(
            "patrimoine.demande.materiel.code"
        ),
    )
    demandeur_id = fields.Many2one(
        "res.users",
        string="Demandeur",
        required=True,
        default=lambda self: self.env.user,
        readonly=True,
        tracking=True,
    )
    motif_demande = fields.Text(
        string="Motif général de la demande", required=True, tracking=True
    )

    # CHAMP PRINCIPAL : le lien vers les lignes
    ligne_ids = fields.One2many(
        "patrimoine.demande.materiel.ligne",
        "demande_id",
        string="Lignes de la demande",
        copy=True
    )

    state = fields.Selection(
        [
            ("pending", "En attente de validation"),
            ("approved", "Approuvée"),
            ("rejected", "Rejetée"),
            ("allocated", "Matériel alloué"),
        ],
        string="Statut",
        default="pending",
        tracking=True,
    )
    date_demande = fields.Datetime(
        string="Date de la Demande",
        default=fields.Datetime.now,
        readonly=True,
        tracking=True,
    )
    date_traitement = fields.Datetime(
        string="Date de Traitement", readonly=True, tracking=True
    )

    allocated_asset_ids = fields.Many2many(
        "patrimoine.asset", string="Matériels Alloués", tracking=True
    )

    # ... (action_approve, action_reject, action_allocate, create, contraintes) ...
    def action_approve(self):
        self.ensure_one()
        if self.state == "pending":
            self.write({"state": "approved", "date_traitement": fields.Datetime.now()})
            return True
        raise ValidationError(
            "La demande doit être en statut 'En attente de validation' pour être approuvée."
        )

    def action_reject(self):
        self.ensure_one()
        if self.state == "pending":
            self.write({"state": "rejected", "date_traitement": fields.Datetime.now()})
            return True
        raise ValidationError(
            "La demande doit être en statut 'En attente de validation' pour être rejetée."
        )

    def action_allocate(self):
        self.ensure_one()
        if self.state == "approved" and self.allocated_asset_ids:
            self.write({"state": "allocated"})
            return True
        raise ValidationError(
            "La demande doit être approuvée et avoir des matériels alloués pour finaliser l'allocation."
        )

    @api.model
    def create(self, vals):
        if vals.get("name", "/") == "/":
            vals["name"] = (
                self.env["ir.sequence"].next_by_code("patrimoine.demande.materiel.code")
                or "Nouvelle Demande"
            )
        return super(PatrimoineDemandeMateriel, self).create(vals)

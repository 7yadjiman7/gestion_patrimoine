# dans models/pertes.py

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class PatrimoinePerte(models.Model):
    _name = "patrimoine.perte"
    _description = "Déclaration de Perte de Matériel"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    name = fields.Char(
        string="Référence",
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _("Nouveau"),
    )
    asset_id = fields.Many2one(
        "patrimoine.asset", string="Bien Concerné", required=True, tracking=True
    )
    motif = fields.Text(string="Motif de la Perte", required=True, tracking=True)
    date_perte = fields.Date(
        string="Date de la Perte",
        required=True,
        default=fields.Date.context_today,
        tracking=True,
    )
    circonstances = fields.Text(string="Circonstances Détaillées")
    lieu_perte = fields.Char(string="Lieu de la Perte")
    actions_entreprises = fields.Text(string="Actions Immédiates Entreprises")
    rapport_police = fields.Boolean(string="Déclaration à la Police Effectuée ?")

    declarer_par_id = fields.Many2one(
        "res.users",
        string="Déclaré par",
        required=True,
        default=lambda self: self.env.user,
        readonly=True,
    )
    manager_id = fields.Many2one(
        "hr.employee", string="Manager", compute="_compute_manager", store=True
    )
    viewer_ids = fields.Many2many(
        "res.users",
        "perte_view_rel",
        "perte_id",
        "user_id",
        string="Vues",
    )
    valide_par_id = fields.Many2one(
        "res.users", string="Validé par (Admin)", readonly=True
    )
    date_validation = fields.Datetime(string="Date de Validation", readonly=True)

    state = fields.Selection(
        [
            ("draft", "Brouillon"),
            ("to_approve", "En attente de validation Manager"),
            ("manager_approved", "En attente de validation Admin"),
            ("approved", "Approuvée"),
            ("rejected", "Rejetée"),
        ],
        string="Statut",
        default="draft",
        required=True,
        tracking=True,
    )

    @api.model
    def create(self, vals):
        if vals.get("name", _("Nouveau")) == _("Nouveau"):
            vals["name"] = self.env["ir.sequence"].next_by_code(
                "patrimoine.perte.code"
            ) or _("Nouveau")
        record = super(PatrimoinePerte, self).create(vals)
        partners = []
        if record.manager_id and record.manager_id.user_id.partner_id:
            partners.append(record.manager_id.user_id.partner_id)

        # Notify the department director if available
        director_partner = False
        employee = record.declarer_par_id.employee_ids[:1]
        if employee and employee.department_id and employee.department_id.manager_id:
            director_partner = employee.department_id.manager_id.user_id.partner_id
        if director_partner and director_partner not in partners:
            partners.append(director_partner)

        if partners:
            payload = {
                "type": "new_perte",
                "id": record.id,
                "asset_name": record.asset_id.name,
                "motif": record.motif,
            }
            notifications = [(p, payload) for p in partners]
            self.env["bus.bus"].sendmany(notifications)
        return record

    @api.depends("declarer_par_id")
    def _compute_manager(self):
        for rec in self:
            employee = self.env["hr.employee"].search(
                [("user_id", "=", rec.declarer_par_id.id)], limit=1
            )
            rec.manager_id = employee.parent_id if employee else False

    def action_submit(self):
        self.write({"state": "to_approve"})

    def action_manager_approve(self):
        self.write({"state": "manager_approved"})

    def action_approve(self):
        for rec in self:
            rec.asset_id.write(
                {"etat": "hs", "active": False}
            )  # Désactive et met HS le matériel
            rec.write(
                {
                    "state": "approved",
                    "valide_par_id": self.env.user.id,
                    "date_validation": fields.Datetime.now(),
                }
            )

    def action_reject(self):
        self.write({"state": "rejected"})

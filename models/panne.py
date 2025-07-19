from odoo import models, fields, api, _


class PatrimoinePanne(models.Model):
    _name = "patrimoine.panne"
    _description = "Signalement de Panne"
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
    description = fields.Text(string="Description", required=True, tracking=True)
    date_panne = fields.Date(
        string="Date de la panne",
        required=True,
        default=fields.Date.context_today,
        tracking=True,
    )
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
        "panne_view_rel",
        "panne_id",
        "user_id",
        string="Vues",
    )
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
    def create(self, vals_list):
        if vals_list.get("name", _("Nouveau")) == _("Nouveau"):
            vals_list["name"] = self.env["ir.sequence"].next_by_code(
                "patrimoine.panne.code"
            ) or _("Nouveau")
        record = super().create(vals_list)
        partner = record.manager_id.user_id.partner_id if record.manager_id else None
        if partner:
            payload = {
                "type": "new_panne",
                "id": record.id,
                "asset_name": record.asset_id.name,
                "description": record.description,
            }
            self.env["bus.bus"].sendmany([(partner, payload)])
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
        self.write({"state": "approved"})

    def action_reject(self):
        self.write({"state": "rejected"})

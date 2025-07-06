from odoo import models, fields


class IntranetPost(models.Model):
    _name = "intranet.post"
    _description = "Post Intranet"
    _order = "create_date desc"

    name = fields.Char(string="Titre", required=True)
    body = fields.Text(string="Contenu")
    user_id = fields.Many2one(
        "res.users",
        string="Auteur",
        required=True,
        default=lambda self: self.env.user,
    )
    department_id = fields.Many2one(
        "hr.department", string="D\xC3\xA9partement"
    )
    image = fields.Image(string="Image")
    active = fields.Boolean(string="Actif", default=True)

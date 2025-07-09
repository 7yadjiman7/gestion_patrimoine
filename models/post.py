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
    author_id = fields.Many2one(
        "res.users",
        string="Auteur",
        required=True,
        default=lambda self: self.env.user,
        related="user_id",
        store=True,
        readonly=False,
    )
    department_id = fields.Many2one("hr.department", string="Département")
    image = fields.Image(string="Image")
    attachment_ids = fields.Many2many(
        "ir.attachment",
        "intranet_post_attachment_rel",
        "post_id",
        "attachment_id",
        string="Pièces jointes",
    )
    post_type = fields.Selection(
        [
            ("text", "Texte"),
            ("image", "Image"),
            ("video", "Vidéo"),
            ("file", "Fichier"),
        ],
        string="Type",
        default="text",
    )
    comment_ids = fields.One2many(
        "intranet.post.comment", "post_id", string="Commentaires"
    )
    like_ids = fields.One2many(
        "intranet.post.like", "post_id", string="Mentions j'aime"
    )
    viewer_ids = fields.Many2many(
        "res.users",
        "intranet_post_view_rel",
        "post_id",
        "user_id",
        string="Vues",
    )
    view_count = fields.Integer(
        string="Nombre de vues", compute="_compute_view_count", store=True
    )
    share_ids = fields.One2many(
        "intranet.post.share", "post_id", string="Partages"
    )
    active = fields.Boolean(string="Actif", default=True)

    @api.depends("viewer_ids")
    def _compute_view_count(self):
        for post in self:
            post.view_count = len(post.viewer_ids)


class IntranetPostComment(models.Model):
    _name = "intranet.post.comment"
    _description = "Commentaire de post"

    post_id = fields.Many2one(
        "intranet.post", string="Post", required=True, ondelete="cascade"
    )
    user_id = fields.Many2one(
        "res.users", string="Auteur", required=True, default=lambda self: self.env.user
    )
    content = fields.Text(string="Commentaire", required=True)


class IntranetPostLike(models.Model):
    _name = "intranet.post.like"
    _description = "Like de post"

    post_id = fields.Many2one(
        "intranet.post", string="Post", required=True, ondelete="cascade"
    )
    user_id = fields.Many2one(
        "res.users",
        string="Utilisateur",
        required=True,
        default=lambda self: self.env.user,
    )

    _sql_constraints = [
        ("unique_like", "unique(post_id, user_id)", "Like déjà existant"),
    ]


class IntranetPostShare(models.Model):
    _name = "intranet.post.share"
    _description = "Partage de post"

    post_id = fields.Many2one(
        "intranet.post", string="Post", required=True, ondelete="cascade"
    )
    user_id = fields.Many2one(
        "res.users",
        string="Utilisateur",
        required=True,
        default=lambda self: self.env.user,
    )
    date_shared = fields.Datetime(string="Date", default=fields.Datetime.now)

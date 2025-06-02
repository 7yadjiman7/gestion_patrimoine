from odoo import models, fields, api

class PatrimoineAsset(models.Model):
    _name = 'patrimoine.asset'
    _description = 'Bien patrimonial'
    # _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string="Nom du bien", required=True, tracking=True)
    image = fields.Image("Image du bien", max_width=1024, max_height=1024)
    type = fields.Selection([
        ('vehicule', 'Véhicule'),
        ('informatique', 'Informatique'),
        ('mobilier', 'Mobilier'),
    ], string="Type de matériel", required=True)
    date_acquisition = fields.Date(string="Date d'acquisition", required=False, default=fields.Date.today())
    valeur_acquisition = fields.Float(string="Valeur")
    etat = fields.Selection([
        ('stock', 'En stock'),
        ('service', 'En service'),
        ('hs', 'Hors service'),
        ('reforme', 'Réformé'),
    ], string="État", default="stock", tracking=True)
    department_id = fields.Many2one('hr.department', string="Département")
    employee_id = fields.Many2one('hr.employee', string="Employé affecté")
    location_id = fields.Many2one('stock.location', string="Localisation")
    # Facture
    facture_file = fields.Binary(string="Fichier Facture")
    facture_filename = fields.Char(string="Nom du fichier facture")
    # Bon de Livraison
    bon_livraison_file = fields.Binary(string="Fichier Bon de Livraison")
    bon_livraison_filename = fields.Char(string="Nom du fichier Bon de Livraison")

    fournisseur = fields.Many2one('res.partner', string="Fournisseur")
    mouvement_ids = fields.One2many(
        'patrimoine.mouvement',
        'asset_id',
        string="Historique des Mouvements",
        readonly=True
    )
    fiche_vie_ids = fields.One2many(
        'patrimoine.fiche.vie',
        'asset_id',
        string="Historique Fiche de Vie",
        readonly=True # Cet historique est géré par les événements, pas directement modifiable
    )

   # Champ pour le code initial généré à la création
    initial_code = fields.Char(
        string='Code Initial',
        required=True,
        readonly=True,
        copy=False,
        default='/' # Défini par défaut pour être géré par la séquence
    )

    # Le champ 'code' principal, qui sera le code complet et calculé
    code = fields.Char(
        string='Code du Bien (Complet)',
        compute='_compute_full_code',
        store=True, # Stocke la valeur pour la recherche et les rapports
        readonly=True,
        copy=False
    )

    # Dépendances pour le calcul du code complet
    @api.depends('initial_code', 'department_id', 'location_id', 'employee_id')
    def _compute_full_code(self):
        for record in self:
            dept_code = record.department_id.name if record.department_id else 'N/A_DEPT'
            loc_code = record.location_id.name if record.location_id else 'N/A_LOC'
            emp_code = record.employee_id.name if record.employee_id else 'N/A_EMP'

            # Si le matériel n'est pas encore affecté, affiche seulement le code initial
            if not record.department_id and not record.location_id and not record.employee_id:
                record.code = record.initial_code
            else:
                # Sinon, complète le code initial avec les infos d'affectation
                record.code = f"{record.initial_code}-{dept_code}/{loc_code}/{emp_code}"


    # Méthode create pour générer le code initial et créer une entrée dans la fiche de vie
    @api.model_create_multi
    def create(self, vals_list):
        assets = super().create(vals_list) # Appelle la méthode create de la superclasse
        for asset in assets:
            if asset.initial_code == '/': # Si le code initial n'a pas été généré (cas improbable avec default='/')
                # Format de date actuel (d/m/a)
                current_date_str = fields.Date.today().strftime("%d/%m/%Y")
                # Générer le numéro de séquence unique
                sequence_num = self.env['ir.sequence'].next_by_code('patrimoine.asset.initial_code') or '0000'
                asset.initial_code = f"{current_date_str}-MTND-{sequence_num}" # Assigner le code généré

            # Créer une entrée dans la fiche de vie pour la création du bien
            self.env['patrimoine.fiche.vie'].create({
                'asset_id': asset.id,
                'action': 'creation',
                'description': f"Création initiale du bien {asset.name}.",
                'utilisateur_id': self.env.uid, # L'utilisateur courant
            })
        return assets


# Model pour la déclaration de perte

class PatrimoineDeclarationPerte(models.Model):
    _name = 'patrimoine.perte'
    _description = 'Déclaration de perte'

    asset_id = fields.Many2one('patrimoine.asset', required=True)
    date = fields.Date(required=True)
    motif = fields.Text()
    responsable = fields.Many2one('res.users')
    state = fields.Selection([
        ('brouillon', 'Brouillon'),
        ('confirme', 'Confirmé'),
    ], default='brouillon')

    show_confirm_button = fields.Boolean(compute="_compute_show_confirm_button", store=False)

    @api.depends('state')
    def _compute_show_confirm_button(self):
        for rec in self:
            rec.show_confirm_button = rec.state == 'brouillon'

    def action_confirmer(self):
        for rec in self:
            rec.state = 'confirme'



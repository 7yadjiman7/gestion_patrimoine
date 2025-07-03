from odoo import models, fields, api

# tables pour les catégories
class AssetCategory(models.Model):
    _name = 'asset.category'
    _description = 'Catégorie principale de matériel'
    
    name = fields.Char('Nom', required=True)
    code = fields.Char('Code', required=True)
    image = fields.Image('Icône')
    active = fields.Boolean('Actif', default=True)
    type = fields.Selection([
        ('informatique', 'Informatique'),
        ('mobilier', 'Mobilier'), 
        ('vehicule', 'Véhicule'),
        ('roulant', 'Roulant')
    ], string='Type', required=True)
    subcategory_ids = fields.One2many('asset.subcategory', 'category_id', string='Sous-catégories')
    # AJOUT : Champ calculé pour le nombre total de matériels dans toutes les sous-catégories de cette catégorie
    total_item_count = fields.Integer(
        string="Nb total Matériels",
        compute='_compute_total_item_count',
        store=True # Stocke la valeur pour la recherche et les rapports
    )

    def _compute_total_item_count(self):
        for category in self:
            count = 0
            for subcategory in category.subcategory_ids:
                count += len(subcategory.item_ids)
            category.total_item_count = count

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Le code de la catégorie doit être unique !'),
    ]

# tables pour les sous-catégories
class AssetSubCategory(models.Model):
    _name = 'asset.subcategory'
    _description = 'Sous-catégorie spécifique de matériel'

    name = fields.Char('Nom', required=True)
    code = fields.Char('Code', required=True)
    category_id = fields.Many2one('asset.category', string='Catégorie', required=True)
    active = fields.Boolean('Actif', default=True)
    custom_field_ids = fields.One2many('asset.custom.field', 'subcategory_id', string='Champs personnalisés')
    item_ids = fields.One2many('patrimoine.asset', 'subcategory_id', string='Matériels')
    image = fields.Image(string="Image")
    # AJOUT : Champ calculé pour le nombre de matériels directement liés à cette sous-catégorie
    item_count = fields.Integer(
        string="Nb Matériels",
        compute='_compute_item_count',
        store=True
    )

    @api.depends('item_ids')
    def _compute_item_count(self):
        for subcategory in self:
            subcategory.item_count = len(subcategory.item_ids)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Le code de la sous-catégorie doit être unique !'),
        ('name_category_unique', 'unique(name, category_id)', 'Le nom de la sous-catégorie doit être unique par catégorie principale !'),
    ]


class AssetCustomField(models.Model):
    _name = 'asset.custom.field'
    _description = 'Champ personnalisé pour sous-catégorie'
    
    name = fields.Char('Libellé', required=True)
    technical_name = fields.Char('Nom technique', required=True, help="Nom utilisé pour l'API (sans espaces, en minuscule)")
    field_type = fields.Selection([
        ('char', 'Texte'),
        ('integer', 'Nombre entier'),
        ('float', 'Nombre décimal'),
        ('boolean', 'Oui/Non'),
        ('date', 'Date'),
        ('selection', 'Liste de choix')
    ], string='Type', required=True)
    selection_values = fields.Text('Valeurs pour liste',
        help="Entrez une valeur par ligne pour les champs de type liste")
    required = fields.Boolean('Requis', default=True)
    subcategory_id = fields.Many2one('asset.subcategory', string='Sous-catégorie', required=True)
    sequence = fields.Integer('Ordre', default=10)
    _sql_constraints = [
        ('technical_name_unique_per_subcategory', 'unique(technical_name, subcategory_id)', 'Le nom technique du champ doit être unique par sous-catégorie !'),
    ]

from odoo import http
import json

class PatrimoineAsset(models.Model):
    _name = 'patrimoine.asset'
    _description = 'Bien patrimonial'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string="Nom du bien", required=True, tracking=True)
    subcategory_id = fields.Many2one('asset.subcategory', string='Sous-catégorie', required=True)
    category_id = fields.Many2one(related='subcategory_id.category_id', string='Catégorie', store=True)
    custom_values = fields.Json('Valeurs personnalisées')
    image = fields.Image("Image du bien", max_width=1024, max_height=1024)
    type = fields.Selection(related='subcategory_id.category_id.type', string="Type de matériel", store=True)
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

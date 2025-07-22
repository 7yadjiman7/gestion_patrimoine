from odoo import http, _, fields 
from odoo.fields import Date
from dateutil.relativedelta import relativedelta
from odoo.http import request
from odoo.exceptions import AccessError, ValidationError
import json
from odoo.osv import expression
from werkzeug.exceptions import BadRequest
import base64  # Pour encoder/décoder les fichiers
import logging
from .common import Response, handle_api_errors, json_response, CORS_HEADERS

_logger = logging.getLogger(__name__)


class PatrimoineAssetController(http.Controller):
    @http.route("/api/patrimoine/categories", auth="public", type="http", methods=["GET"], csrf=False)
    def list_categories(self, **kw):

        try:
            domain = []
            if kw.get("type"):
                domain.append(("code", "=", kw["type"]))
            categories = request.env["asset.category"].search(domain)
            category_data = [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "code": cat.code,
                    "type": cat.type,
                    "filter_type": cat.code,  # Pour le filtrage frontend
                    "image": (
                        f"/web/image/asset.category/{cat.id}/image"
                        if cat.image
                        else None
                    ),
                    "subcategories": [
                        {"id": sub.id, "name": sub.name, "code": sub.code}
                        for sub in cat.subcategory_ids
                    ],
                }
                for cat in categories
            ]
            return Response(
                json.dumps(category_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing categories: %s", str(e))
            return Response(status=500)

    @http.route("/api/patrimoine/demande_materiel/<int:demande_id>", auth="user", type="json", methods=["GET"])
    def get_demande_details(self, demande_id):
        try:
            demande = http.request.env['patrimoine.demande_materiel'].browse(demande_id)
            if not demande.exists():
                return {"error": "Demande not found"}, 404

            return {
                "id": demande.id,
                "name": demande.name,
                "state": demande.state,
                "ligne_ids": [{
                    "id": ligne.id,
                    "product_id": ligne.product_id.id,
                    "quantity": ligne.quantity
                } for ligne in demande.ligne_ids]
            }
        except Exception as e:
            return {"error": str(e)}, 500

    @http.route("/api/patrimoine/demande_materiel/<int:demande_id>", auth="user", type="http", methods=["GET"])
    def get_demande_details_http(self, demande_id):
        try:
            demande = request.env['patrimoine.demande_materiel'].browse(demande_id)
            if not demande.exists():
                return Response(
                    json.dumps({"error": "Demande not found"}),
                    status=404,
                    headers=CORS_HEADERS,
                )

            data = {
                "id": demande.id,
                "name": demande.name,
                "state": demande.state,
                "ligne_ids": [
                    {
                        "id": ligne.id,
                        "product_id": ligne.product_id.id,
                        "quantity": ligne.quantity,
                    }
                    for ligne in demande.ligne_ids
                ],
            }

            return Response(json.dumps(data), headers=CORS_HEADERS)
        except Exception as e:
            _logger.error("Error getting demande details: %s", str(e))
            return Response(status=500, headers=CORS_HEADERS)

    @http.route(
        "/api/patrimoine/subcategories/<int:category_id>",
        auth="public",
        type="http",
        methods=["GET"],
        csrf=False)
    @handle_api_errors
    def list_subcategories(self, category_id, **kw):
        domain = []
        # Gère le cas où l'on veut toutes les sous-catégories
        if category_id != 0:
            # Vérifier que la catégorie parente existe
            category = request.env["asset.category"].browse(category_id)
            if not category.exists():
                return Response(
                    json.dumps({
                        "status": "error",
                        "code": 404,
                        "message": "Category not found"
                    }),
                    status=404,
                    headers=CORS_HEADERS
                )
            domain.append(("category_id", "=", category_id))

        subcategories = request.env["asset.subcategory"].search(domain)

        subcategory_data = []
        for sub in subcategories:
            # Construit une URL valide vers l'image si elle existe
            image_url = (
                f"/web/image/asset.subcategory/{sub.id}/image" if sub.image else None
            )

            subcategory_data.append(
                {
                    "id": sub.id,
                    "name": sub.name,
                    "code": sub.code,
                    "category_id": sub.category_id.id,
                    "category_name": sub.category_id.name,
                    "category_type": sub.category_id.type,
                    "image_url": image_url,
                    "fields": [
                        {
                            "id": field.id,
                            "name": field.name,
                            "technical_name": field.technical_name,
                            "type": field.field_type,
                            "required": field.required,
                            "selection_values": (
                                field.selection_values.split("\n")
                                if field.field_type == "selection"
                                else None
                            ),
                            "sequence": field.sequence,
                        }
                        for field in sub.custom_field_ids.sorted("sequence")
                    ],
                    "item_count": len(sub.item_ids),
                }
            )

        return Response(
            json.dumps({
                "status": "success",
                "data": subcategory_data
            }, default=str),
            headers=CORS_HEADERS
        )

    @http.route(
        "/api/patrimoine/items/<int:subcategory_id>",
        auth="user",
        type="http",
        methods=["GET"])
    @handle_api_errors
    def list_items(self, subcategory_id, **kw):
        items = request.env["patrimoine.asset"].search(
            [("subcategory_id", "=", subcategory_id)]
        )
        item_data = []
        for item in items:
            item_data.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "code": item.code,
                    "subcategory_id": item.subcategory_id.id,
                    "subcategory_name": item.subcategory_id.name,
                    "category_id": item.category_id.id,
                    "category_name": item.category_id.name,
                    "image": (
                        f"/web/image/patrimoine.asset/{item.id}/image"
                        if item.image
                        else None
                    ),
                    "custom_values": item.custom_values,
                    "status": item.etat,
                    "assigned_to": (
                        item.employee_id.name if item.employee_id else None
                    ),
                    "assigned_to_id": (
                        item.employee_id.id if item.employee_id else None
                    ),
                    "department": (
                        item.department_id.name if item.department_id else None
                    ),
                    "department_id": (
                        item.department_id.id if item.department_id else None
                    ),
                    "location": item.location_id.name if item.location_id else None,
                    "location_id": (
                        item.location_id.id if item.location_id else None
                    ),
                    "acquisition_date": (
                        item.date_acquisition.strftime("%Y-%m-%d")
                        if item.date_acquisition
                        else None
                    ),
                    "acquisition_value": item.valeur_acquisition,
                }
            )
        return Response(
            json.dumps({
                "status": "success",
                "data": item_data
            }, default=str),
            headers=CORS_HEADERS
        )

    @http.route(
        "/api/patrimoine/items", auth="user", type="json", methods=["POST"], csrf=False)
    def create_item(self, **post):
        _logger.info("Début de la création d'un item (matériel)")
        try:
            # 1. Récupérer et valider la sous-catégorie
            subcategory_id = post.get("subcategory_id")
            if not subcategory_id:
                return {"status": "error", "message": "Subcategory ID is required."}
            subcategory = request.env["asset.subcategory"].browse(int(subcategory_id))
            if not subcategory.exists():
                return {"status": "error", "message": "Subcategory not found."}

            # 2. Préparer les valeurs de base pour patrimoine.asset
            asset_vals = {
                "name": post.get("name"),
                "subcategory_id": subcategory.id,  # <-- NOUVEAU LIEN VERS LA SOUS-CATÉGORIE
                "type": subcategory.category_id.type,  # <-- DÉDUIRE LE TYPE GÉNÉRAL DE LA CATÉGORIE PRINCIPALE
                "date_acquisition": post.get("date_acquisition"),
                "valeur_acquisition": (
                    float(post.get("valeur_acquisition"))
                    if post.get("valeur_acquisition")
                    else 0.0
                ),
                "etat": post.get("status", "stock"),
                "department_id": (
                    int(post.get("department_id"))
                    if post.get("department_id")
                    else False
                ),
                "employee_id": (
                    int(post.get("employee_id")) if post.get("employee_id") else False
                ),
                "location_id": (
                    int(post.get("location_id")) if post.get("location_id") else False
                ),
                "fournisseur": (
                    int(post.get("fournisseur")) if post.get("fournisseur") else False
                ),
            }

            # Gérer l'upload de l'image principale
            if (
                "image" in request.httprequest.files
                and request.httprequest.files["image"]
            ):
                image_file = request.httprequest.files["image"]
                asset_vals["image"] = base64.b64encode(image_file.read())

            # Gérer l'upload des fichiers (facture, bon_livraison)
            if (
                "facture" in request.httprequest.files
                and request.httprequest.files["facture"]
            ):
                facture_file = request.httprequest.files["facture"]
                asset_vals["facture_file"] = base64.b64encode(facture_file.read())
                asset_vals["facture_filename"] = facture_file.filename

            if (
                "bon_livraison" in request.httprequest.files
                and request.httprequest.files["bon_livraison"]
            ):
                bl_file = request.httprequest.files["bon_livraison"]
                asset_vals["bon_livraison_file"] = base64.b64encode(bl_file.read())
                asset_vals["bon_livraison_filename"] = bl_file.filename

            # 3. Créer l'asset principal (patrimoine.asset)
            new_item = request.env["patrimoine.asset"].create(asset_vals)

            # 4. Gérer les valeurs des champs personnalisés (stockés dans custom_values de patrimoine.asset)
            custom_values_data = {}
            # Les champs personnalisés sont envoyés sous la forme 'custom_field_X' où X est l'ID du champ
            for key, value in post.items():
                if key.startswith("custom_field_"):
                    field_id = key[len("custom_field_") :]
                    # Vous pourriez valider les types ici si nécessaire
                    custom_values_data[field_id] = value

            # Stocker directement les valeurs personnalisées dans le champ JSON
            if custom_values_data:
                new_item.write({"custom_values": custom_values_data})

            # 5. Gérer les détails spécifiques (informatique, véhicule, mobilier)
            # Puisque patrimoine.asset a maintenant subcategory_id,
            # et que les champs spécifiques sont dans les modèles hérités,
            # nous devons lier l'item aux modèles hérités.
            # Le 'type' est maintenant déduit de la sous-catégorie (subcategory.category_id.type).

            # Récupérer les données spécifiques envoyées par le frontend pour ces modèles hérités
            specific_inherited_data = {}
            for key, value in post.items():
                if key.startswith("specific_inherited_data["):
                    field_name = key[len("specific_inherited_data[") : -1]
                    specific_inherited_data[field_name] = value

            if new_item.type == "informatique":
                request.env["patrimoine.asset.informatique"].create(
                    {
                        "asset_id": new_item.id,
                        "categorie_materiel": specific_inherited_data.get(
                            "categorie_materiel"
                        ),  # Ou déduit de subcategory si besoin
                        "marque": specific_inherited_data.get("marque"),
                        "modele": specific_inherited_data.get("modele"),
                        "numero_serie": specific_inherited_data.get("numero_serie"),
                        "date_garantie_fin": specific_inherited_data.get(
                            "date_garantie_fin"
                        ),
                        "fournisseur": specific_inherited_data.get(
                            "fournisseur_specifique"
                        ),  # Si un fournisseur spécifique à ce type
                    }
                )
            elif new_item.type == "vehicule":
                request.env["patrimoine.asset.vehicule"].create(
                    {
                        "asset_id": new_item.id,
                        "immatriculation": specific_inherited_data.get(
                            "immatriculation"
                        ),
                        "marque": specific_inherited_data.get("marque"),
                        "modele": specific_inherited_data.get("modele"),
                        "kilometrage": (
                            float(specific_inherited_data.get("kilometrage"))
                            if specific_inherited_data.get("kilometrage")
                            else 0.0
                        ),
                        # date_achat, date_premiere_circulation, etc. si envoyés
                    }
                )
            elif new_item.type == "mobilier":
                request.env["patrimoine.asset.mobilier"].create(
                    {
                        "asset_id": new_item.id,
                        "categorie_mobilier": specific_inherited_data.get(
                            "categorie_mobilier"
                        ),  # Ou déduit de subcategory si besoin
                        "etat_conservation": specific_inherited_data.get(
                            "etat_conservation"
                        ),
                    }
                )

            # 6. Créer une entrée dans la fiche de vie
            request.env["patrimoine.fiche.vie"].create(
                {
                    "asset_id": new_item.id,
                    "action": "creation",
                    "description": f"Création de l'item {new_item.name}",
                    "utilisateur_id": request.env.uid,
                }
            )

            return {
                "status": "success",
                "item_id": new_item.id,
                "item_code": new_item.code,
            }
        except Exception as e:
            _logger.error("Error creating item: %s", str(e))
            return {"status": "error", "message": str(e)}

    # --- API pour lister les ITEMS (patrimoine.asset) filtrés par type/sous-catégorie ---

    # Gardez la première route pour lister TOUS les assets sans filtre

    @http.route("/api/patrimoine/assets", auth="user", type="http", methods=["GET"])
    def list_all_assets(
        self, **kw
    ):  # Renommée pour la clarté, prend tous les params au cas où
        _logger.info(f"list_all_assets: DÉBUT REQUÊTE. Params reçus: {kw}")
        # AJOUTEZ CETTE LIGNE POUR LE TEST

        try:
            # AUCUN FILTRE APPLIQUÉ DANS CETTE ROUTE, elle renvoie tout.
            assets = request.env["patrimoine.asset"].search([])
            _logger.info(f"list_all_assets: {len(assets)} assets trouvés (pas de filtre).")

            asset_data = []
            for asset in assets:
                date_acquisition_str = (
                    asset.date_acquisition.strftime("%Y-%m-%d")
                    if asset.date_acquisition
                    else None
                )
                details = {}
                image_url = (
                    f"/web/image/patrimoine.asset/{asset.id}/image" if asset.image else None
                )

                asset_data.append(
                    {
                        "id": asset.id,
                        "name": asset.name,
                        "image": image_url,
                        "code": asset.code,
                        "type": asset.type,
                        "location": (asset.location_id.name if asset.location_id else None),
                        "category_general_name": (
                            asset.subcategory_id.category_id.name
                            if asset.subcategory_id and asset.subcategory_id.category_id
                            else None
                        ),
                        "category_detailed_name": (
                            asset.subcategory_id.name if asset.subcategory_id else None
                        ),
                        "acquisitionDate": date_acquisition_str,
                        "value": asset.valeur_acquisition,
                        "status": asset.etat,
                        "assignedTo": (
                            asset.employee_id.name if asset.employee_id else None
                        ),
                        "details": details,
                        "customValues": asset.custom_values or {},
                    }
                )
            return Response(
                json.dumps(asset_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing ALL assets: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # NOUVELLE MÉTHODE list_assets_filtered POUR GÉRER LE FILTRAGE AVEC PATH VARIABLES
    @http.route(
        [
            "/api/patrimoine/assets", # Nouvelle route pour lister tous les assets (sans filtre dans le chemin)
            "/api/patrimoine/assets/type/<string:general_type>",  # Pour filtrer par type général
            "/api/patrimoine/assets/category/<string:subcategory_code>",  # Pour filtrer par sous-catégorie
        ],
        auth="user",
        type="http",
        methods=["GET"],
        
    )
    def list_assets_filtered(
        self, general_type=None, subcategory_code=None, **kw
    ):  # <-- Les paramètres sont directement capturés
        _logger.info(
            f"list_assets_filtered: DÉBUT REQUÊTE. Params reçus (depuis URL): general_type={general_type}, subcategory_code={subcategory_code}"
        )
        try:
            domain = []

            if general_type:
                domain.append(("type", "=", general_type))
                _logger.info(
                    f"list_assets_filtered: Domaine ajouté pour general_type: {general_type}. Domaine actuel: {domain}"
                )

            if subcategory_code:
                _logger.info(
                    f"list_assets_filtered: Tentative de filtrage par subcategory_code: '{subcategory_code}'"
                )
                subcat_record = (
                    request.env["asset.subcategory"]
                    .sudo()
                    .search([("code", "=", subcategory_code)], limit=1)
                )

                if subcat_record:
                    domain.append(("subcategory_id", "=", subcat_record.id))
                    _logger.info(
                        f"list_assets_filtered: Sous-catégorie trouvée (code: {subcategory_code}, ID: {subcat_record.id}). Domaine ajouté: {domain}"
                    )
                else:
                    _logger.warning(
                        f"list_assets_filtered: Sous-catégorie '{subcategory_code}' non trouvée par code. Retourne une liste vide pour les assets."
                    )
                    return Response(
                        json.dumps([]), headers={"Content-Type": "application/json"}
                    )

            _logger.info(
                f"list_assets_filtered: Domaine FINAL utilisé pour la recherche sur patrimoine.asset: {domain}"
            )
            assets = request.env["patrimoine.asset"].search(domain)
            _logger.info(
                f"list_assets_filtered: {len(assets)} assets trouvés avec le domaine final {domain}."
            )

            asset_data = []
            for asset in assets:
                date_acquisition_str = (
                    asset.date_acquisition.strftime("%Y-%m-%d")
                    if asset.date_acquisition
                    else None
                )
                details = {}
                image_url = (
                    f"/web/image/patrimoine.asset/{asset.id}/image" if asset.image else None
                )

                asset_data.append(
                    {
                        "id": asset.id,
                        "name": asset.name,
                        "image": image_url,
                        "code": asset.code,
                        "type": asset.type,
                        "location": (asset.location_id.name if asset.location_id else None),
                        "category_general_name": (
                            asset.subcategory_id.category_id.name
                            if asset.subcategory_id and asset.subcategory_id.category_id
                            else None
                        ),
                        "category_detailed_name": (
                            asset.subcategory_id.name if asset.subcategory_id else None
                        ),
                        "acquisitionDate": date_acquisition_str,
                        "value": asset.valeur_acquisition,
                        "status": asset.etat,
                        "assignedTo": (
                            asset.employee_id.name if asset.employee_id else None
                        ),
                        "details": details,
                        "customValues": asset.custom_values or {},
                    }
                )
            return Response(
                json.dumps(asset_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing filtered assets: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    @http.route('/api/patrimoine/assets/filter', auth='user', type='http', methods=['GET'])
    def get_filtered_assets(self, **kw):
        """
        Route générique pour filtrer les matériels en fonction de divers critères
        passés en paramètres de requête (ex: ?status=service&type=informatique).
        """
        try:
            domain = []
            _logger.info(f"Filtres reçus: {kw}")

            if kw.get('status'):
                domain.append(('etat', '=', kw['status']))
            if kw.get('type'):
                domain.append(('type', '=', kw['type']))
            if kw.get('departmentId'):
                domain.append(('department_id', '=', int(kw['departmentId'])))
            if kw.get('subcategoryCode'):
                subcat = request.env['asset.subcategory'].search([('code', '=', kw['subcategoryCode'])], limit=1)
                if subcat:
                    domain.append(('subcategory_id', '=', subcat.id))

            _logger.info(f"Domaine de recherche final: {domain}")
            assets = request.env['patrimoine.asset'].search(domain)

            details = {}
            asset_data = []
            for asset in assets:
                image_url = f'/web/image/patrimoine.asset/{asset.id}/image' if asset.image else None

                asset_data.append(
                    {
                        "id": asset.id,
                        "name": asset.name,
                        "code": asset.code,
                        "image": image_url,
                        "status": asset.etat,
                        "type": asset.type,
                        "category_general_name": (
                            asset.subcategory_id.category_id.name
                            if asset.subcategory_id and asset.subcategory_id.category_id
                            else None
                        ),
                        "category_detailed_name": (
                            asset.subcategory_id.name if asset.subcategory_id else None
                        ),
                        "location": (
                            asset.location_id.name if asset.location_id else None
                        ),
                        "acquisitionDate": (
                            asset.date_acquisition.strftime("%Y-%m-%d")
                            if asset.date_acquisition
                            else None
                        ),
                        "value": asset.valeur_acquisition,
                        "assignedTo": (
                            asset.employee_id.name if asset.employee_id else None
                        ),
                        "assigned_to_id": (
                            asset.employee_id.id if asset.employee_id else None
                        ),
                        "details": details,
                        "customValues": asset.custom_values or {},
                    }
                )

            return Response(json.dumps(asset_data), headers={'Content-Type': 'application/json'})

        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des matériels filtrés: {e}")
            return Response(
                json.dumps({'status': 'error', 'message': str(e)}), 
                status=500,
                headers={'Content-Type': 'application/json'}
            )

    # --- NOUVELLE API : Lister les assets par Département ---
    @http.route("/api/patrimoine/assets/department/<int:department_id>", auth="user", type="http", methods=["GET"])
    def list_assets_by_department(self, department_id, **kw):
        _logger.info(f"list_assets_by_department: Requête reçue pour département ID: {department_id}")
        try:
            domain = [('department_id', '=', department_id)]

            assets = request.env["patrimoine.asset"].search(domain)
            _logger.info(f"list_assets_by_department: {len(assets)} assets trouvés pour le département {department_id}.")

            asset_data = []
            for asset in assets:
                date_acquisition_str = (asset.date_acquisition.strftime("%Y-%m-%d") if asset.date_acquisition else None)
                details = {} 
                image_url = f"/web/image/patrimoine.asset/{asset.id}/image" if asset.image else None

                asset_data.append({
                    "id": asset.id, "name": asset.name, "image": image_url, "code": asset.code, "type": asset.type, 
                    "location": (asset.location_id.name if asset.location_id else None),
                    "category_general_name": (asset.subcategory_id.category_id.name if asset.subcategory_id and asset.subcategory_id.category_id else None),
                    "category_detailed_name": (asset.subcategory_id.name if asset.subcategory_id else None),
                    "acquisitionDate": date_acquisition_str, "value": asset.valeur_acquisition, "status": asset.etat,
                    "assignedTo": (asset.employee_id.name if asset.employee_id else None), 
                    "department": (asset.department_id.name if asset.department_id else None), 
                    "department_id": (asset.department_id.id if asset.department_id else None), # Inclure l'ID du département
                    "details": details, 
                    "customValues": asset.custom_values or {}
                })
            return Response(json.dumps(asset_data), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error("Error listing assets by department: %s", str(e))
            return Response(json.dumps({'status': 'error', 'message': str(e)}), status=500, headers={"Content-Type": "application/json"})

    @http.route('/api/patrimoine/assets', auth="user", type="http", methods=["POST"], csrf=False)
    def create_asset(self, **post):
        _logger.info("Début de la création d'un asset via la route HTTP")
        try:
            # 1. Valider la sous-catégorie et déduire le type
            subcategory_id = post.get("subcategory_id")
            if not subcategory_id:
                raise BadRequest("Le champ 'subcategory_id' est requis.")

            subcategory = request.env["asset.subcategory"].browse(int(subcategory_id))
            if not subcategory.exists():
                raise BadRequest("Sous-catégorie non trouvée.")

            # Le type ('informatique', 'mobilier', etc.) est déduit de la catégorie parente de la sous-catégorie. C'est plus robuste.
            asset_type = subcategory.category_id.type

            # 2. Préparer les valeurs pour le modèle principal 'patrimoine.asset'
            asset_vals = {
                "name": post.get("name"),
                "subcategory_id": subcategory.id,
                "type": asset_type,
                "date_acquisition": post.get("date_acquisition"),
                "valeur_acquisition": float(post.get("valeur_acquisition")) if post.get("valeur_acquisition") else 0.0,
                "etat": post.get("etat", "stock"),
                "department_id": int(post.get("department_id")) if post.get("department_id") else False,
                "employee_id": int(post.get("employee_id")) if post.get("employee_id") else False,
                "location_id": int(post.get("location_id")) if post.get("location_id") else False,
                "fournisseur": int(post.get("fournisseur")) if post.get("fournisseur") else False,
            }

            # Gérer l'upload de l'image principale
            if "image" in request.httprequest.files and request.httprequest.files["image"]:
                image_file = request.httprequest.files["image"]
                asset_vals["image"] = base64.b64encode(image_file.read())

            # Gérer l'upload des fichiers (facture, bon_livraison)
            if "facture" in request.httprequest.files and request.httprequest.files["facture"]:
                facture_file = request.httprequest.files["facture"]
                asset_vals["facture_file"] = base64.b64encode(facture_file.read())
                asset_vals["facture_filename"] = facture_file.filename

            if "bon_livraison" in request.httprequest.files and request.httprequest.files["bon_livraison"]:
                bl_file = request.httprequest.files["bon_livraison"]
                asset_vals["bon_livraison_file"] = base64.b64encode(bl_file.read())
                asset_vals["bon_livraison_filename"] = bl_file.filename

            # 3. Créer l'enregistrement principal 'patrimoine.asset'
            new_asset = request.env["patrimoine.asset"].create(asset_vals)

            # 4. Gérer les données spécifiques héritées (informatique, mobilier, etc.)
            specific_data = {}
            for key, value in post.items():
                # Le frontend envoie les champs sous la forme 'specific_inherited_data[nom_du_champ]'
                if key.startswith("specific_inherited_data["):
                    field_name = key[len("specific_inherited_data["):-1]
                    specific_data[field_name] = value

            # En fonction du type déduit, créer l'enregistrement dans le modèle hérité correspondant
            if asset_type == "informatique":
                specific_data['asset_id'] = new_asset.id
                request.env["patrimoine.asset.informatique"].create(specific_data)
            elif asset_type == "mobilier":
                specific_data['asset_id'] = new_asset.id
                request.env["patrimoine.asset.mobilier"].create(specific_data)
            elif asset_type == "vehicule":
                specific_data['asset_id'] = new_asset.id
                if 'kilometrage' in specific_data: # Assurer que le kilométrage est un nombre
                    specific_data['kilometrage'] = float(specific_data['kilometrage'])
                request.env["patrimoine.asset.vehicule"].create(specific_data)

            # 5. Créer une entrée dans la fiche de vie
            request.env["patrimoine.fiche.vie"].create({
                "asset_id": new_asset.id,
                "action": "creation",
                "description": f"Création de l'asset {new_asset.name}",
                "utilisateur_id": request.env.uid,
            })

            # 6. Retourner une réponse de succès
            return Response(
                json.dumps({"status": "success", "asset_id": new_asset.id, "asset_code": new_asset.code}),
                headers={"Content-Type": "application/json"},
            )

        except Exception as e:
            _logger.error("Erreur lors de la création de l'asset: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # fonction pour la mise à jour de matériel
    @http.route(
        "/api/patrimoine/assets/<int:asset_id>",
        auth="user",
        type="http",
        methods=["PUT"],
        csrf=False,
    )
    @handle_api_errors
    def update_asset(self, asset_id, **kw):
        _logger.info(f"Début de la mise à jour de l'asset ID {asset_id}")

        asset = request.env["patrimoine.asset"].sudo().browse(asset_id)
        if not asset.exists():
            return json_response(
                {"status": "error", "message": "Asset non trouvé"}, status=404
            )

        form_data = request.httprequest.form.to_dict()
        update_vals = {}

        simple_fields = ["name", "date_acquisition", "valeur_acquisition", "etat"]
        relation_fields = ["department_id", "employee_id", "location_id", "fournisseur"]

        for field in simple_fields:
            if field in form_data and form_data[field]:
                update_vals[field] = form_data[field]

        for field in relation_fields:
            if form_data.get(field):
                update_vals[field] = int(form_data[field])

        if "image" in request.httprequest.files:
            image_file = request.httprequest.files["image"]
            update_vals["image"] = base64.b64encode(image_file.read())

        if update_vals:
            asset.write(update_vals)
            _logger.info(
                f"Asset {asset_id} (principal) mis à jour avec les champs : {list(update_vals.keys())}"
            )

        # --- CORRECTION DE LA LOGIQUE POUR LES DONNÉES SPÉCIFIQUES ---
        specific_data = {}
        for key, value in form_data.items():
            if key.startswith("specific_inherited_data["):
                field_name = key[len("specific_inherited_data[") : -1]
                specific_data[field_name] = value

        if specific_data:
            # On cherche l'enregistrement hérité lié (ex: patrimoine.asset.informatique)
            specific_model_name = f"patrimoine.asset.{asset.type}"
            specific_record = request.env[specific_model_name].search(
                [("asset_id", "=", asset.id)], limit=1
            )
            if specific_record:
                specific_record.write(specific_data)
                _logger.info(
                    f"Asset {asset_id} (spécifique) mis à jour avec les champs : {list(specific_data.keys())}"
                )
            else:
                # Si l'enregistrement n'existe pas, on le crée
                specific_data["asset_id"] = asset.id
                request.env[specific_model_name].create(specific_data)
                _logger.info(
                    f"Asset {asset_id} (spécifique) créé avec les champs : {list(specific_data.keys())}"
                )

        return json_response({"status": "success", "asset_id": asset.id})

    # --- NOUVELLE FONCTION DE SUPPRESSION ---
    @http.route(
        "/api/patrimoine/assets/<int:asset_id>",
        auth="user",
        type="http",
        methods=["DELETE"],
        csrf=False,
    )
    @handle_api_errors
    def delete_asset(self, asset_id, **kw):
        asset = request.env["patrimoine.asset"].sudo().browse(asset_id)
        if not asset.exists():
            return {"status": "error", "message": "Asset not found"}, 404

        # On peut créer une entrée dans la fiche de vie avant de supprimer
        request.env["patrimoine.fiche.vie"].sudo().create(
            {
                "asset_id": asset.id,
                "action": "sortie",
                "description": f"Suppression de l'asset {asset.name} (Code: {asset.code})",
                "utilisateur_id": request.env.uid,
            }
        )

        asset.unlink()
        return json_response(
            {"status": "success", "message": "Asset supprimé avec succès"}
        )

    @http.route(
        "/api/patrimoine/assets/<int:asset_id>",
        auth="user",
        type="http",
        methods=["GET"])
    @handle_api_errors
    def get_asset(self, asset_id, **kw):
        asset = request.env["patrimoine.asset"].browse(asset_id)
        if not asset.exists():
            return Response(
                json.dumps({
                    "status": "error",
                    "code": 404,
                    "message": "Asset not found"
                }),
                status=404,
                headers=CORS_HEADERS
            )

        # Conversion de la date d'acquisition
        date_acquisition_str = (
            asset.date_acquisition.strftime("%Y-%m-%d")
            if asset.date_acquisition
            else None
        )

        # Récupération des détails spécifiques selon le type
        details = {}
        if asset.type == "informatique":
            details_record = request.env["patrimoine.asset.informatique"].search(
                [("asset_id", "=", asset.id)], limit=1
            )
            if details_record:
                details_data = details_record.read([
                    "marque", "modele", "numero_serie",
                    "date_garantie_fin", "fournisseur"
                ])[0]
                if details_data.get("date_garantie_fin"):
                    details_data["date_garantie_fin"] = details_data["date_garantie_fin"].strftime("%Y-%m-%d")
                details = details_data
        elif asset.type == "vehicule":
            details_record = request.env["patrimoine.asset.vehicule"].search(
                [("asset_id", "=", asset.id)], limit=1
            )
            if details_record:
                details_data = details_record.read([
                    "immatriculation", "marque", "modele", "kilometrage",
                    "date_achat", "date_premiere_circulation",
                    "date_assurance", "date_controle_technique",
                    "kilometrage_precedent"
                ])[0]
                for date_field in ["date_achat", "date_premiere_circulation",
                                  "date_assurance", "date_controle_technique"]:
                    if details_data.get(date_field):
                        details_data[date_field] = details_data[date_field].strftime("%Y-%m-%d")
                details = details_data
        elif asset.type == "mobilier":
            details_record = request.env["patrimoine.asset.mobilier"].search(
                [("asset_id", "=", asset.id)], limit=1
            )
            if details_record:
                details = details_record.read(["categorie_mobilier", "etat_conservation"])[0]

        image_url = f"/web/image/patrimoine.asset/{asset.id}/image" if asset.image else None

        asset_data = {
            "id": asset.id,
            "name": asset.name,
            "image": image_url,
            "code": asset.code,
            "type": asset.type,
            "category": asset.subcategory_id.category_id.name if asset.subcategory_id and asset.subcategory_id.category_id else None,
            "subcategory_id": asset.subcategory_id.id if asset.subcategory_id else None,
            "location": asset.location_id.name if asset.location_id else None,
            "location_id": asset.location_id.id if asset.location_id else None,
            "department": asset.department_id.name if asset.department_id else None,
            "department_id": asset.department_id.id if asset.department_id else None,
            "acquisitionDate": date_acquisition_str,
            "value": asset.valeur_acquisition,
            "status": asset.etat,
            "assignedTo": asset.employee_id.name if asset.employee_id else None,
            "assigned_to_id": asset.employee_id.id if asset.employee_id else None,
            "fournisseur_id": asset.fournisseur.id if asset.fournisseur else None,
            "details": details,
            "customValues": asset.custom_values or {}
        }

        return Response(
            json.dumps({
                "status": "success",
                "data": asset_data
            }, default=str),
            headers=CORS_HEADERS
        )

    # NOUVELLE ROUTE 1 : Pour l'âge du parc matériel
    @http.route(
        "/api/patrimoine/stats/by_age", auth="user", type="http", methods=["GET"])
    def get_stats_by_age(self, **kw):
        try:
            assets = request.env["patrimoine.asset"].search(
                [("date_acquisition", "!=", False)]
            )
            today = Date.today()

            age_brackets = {
                "Moins de 1 an": 0,
                "1 à 2 ans": 0,
                "2 à 3 ans": 0,
                "3 à 5 ans": 0,
                "Plus de 5 ans": 0,
            }

            for asset in assets:
                age = relativedelta(today, asset.date_acquisition).years
                if age < 1:
                    age_brackets["Moins de 1 an"] += 1
                elif age < 2:
                    age_brackets["1 à 2 ans"] += 1
                elif age < 3:
                    age_brackets["2 à 3 ans"] += 1
                elif age < 5:
                    age_brackets["3 à 5 ans"] += 1
                else:
                    age_brackets["Plus de 5 ans"] += 1

            # Formater pour le graphique
            data = [
                {"name": key, "count": value} for key, value in age_brackets.items()
            ]

            return Response(
                json.dumps(data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error(f"Error getting stats by age: {e}")
            return Response(json.dumps({"error": str(e)}), status=500)

    # NOUVELLE ROUTE 2 : Pour la valeur du parc par département
    @http.route(
        "/api/patrimoine/stats/by_department_value",
        auth="user",
        type="http",
        methods=["GET"])
    def get_stats_by_department_value(self, **kw):
        try:
            # On groupe par département et on somme la valeur d'acquisition
            stats_raw = request.env["patrimoine.asset"].read_group(
                domain=[("department_id", "!=", False)],
                fields=["department_id", "valeur_acquisition"],
                groupby=["department_id"],
                lazy=False,
            )

            value_stats = []
            for stat in stats_raw:
                dept_id, dept_name = (
                    stat.get("department_id")
                    if stat.get("department_id")
                    else (None, "Non défini")
                )
                total_value = stat.get("valeur_acquisition", 0)
                value_stats.append(
                    {
                        "id": dept_id,
                        "name": dept_name,
                        "value": total_value,
                    }
                )

            return Response(
                json.dumps(value_stats), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error(f"Error getting stats by department value: {e}")
            return Response(json.dumps({"error": str(e)}), status=500)

    # Récupération des données de d'autres modules
    @http.route("/api/patrimoine/locations", auth="user", type="http", methods=["GET"])
    def get_locations(self, **kw):
        try:
            # Modèle stock.location d'Odoo
            locations = request.env["stock.location"].search([])
            location_data = [
                {
                    "id": loc.id,
                    "name": loc.display_name,  # Utilisez display_name pour le chemin complet de la localisation
                }
                for loc in locations
            ]
            return Response(
                json.dumps(location_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing locations: %s", str(e))
            return Response(status=500)

    @http.route("/api/patrimoine/employees", auth="user", type="http", methods=["GET"])
    def get_employees(self, **kw):
        try:
            # Modèle hr.employee d'Odoo
            employees = request.env["hr.employee"].search([])
            employee_data = [
                {
                    "id": emp.id,
                    "name": emp.name,
                    "user_id": emp.user_id.id if emp.user_id else None,
                }
                for emp in employees
            ]
            return Response(
                json.dumps(employee_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing employees: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/departments", auth="user", type="http", methods=["GET"])
    def get_departments(self, **kw):
        try:
            # Modèle hr.department d'Odoo
            departments = request.env["hr.department"].search([])
            department_data = [{"id": emp.id, "name": emp.name} for emp in departments]
            return Response(
                json.dumps(department_data),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error listing departments: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/fournisseurs", auth="user", type="http", methods=["GET"])
    def get_fournisseurs(self, **kw):
        try:
            # Modèle hr.department d'Odoo
            fournisseurs = request.env["res.partner"].search([])
            fournisseur_data = [
                {"id": emp.id, "name": emp.name} for emp in fournisseurs
            ]
            return Response(
                json.dumps(fournisseur_data),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error listing departments: %s", str(e))
            return Response(status=500)

    # Endpoints pour les champs personnalisés

    @http.route(
        "/api/patrimoine/fields/<int:subcategory_id>",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def create_field(self, subcategory_id, **post):
        try:
            field_vals = {
                "name": post.get("name"),
                "field_type": post.get("type"),
                "required": post.get("required", False),
                "subcategory_id": subcategory_id,
            }
            field = request.env["asset.custom.field"].create(field_vals)
            return {"status": "success", "field_id": field.id}
        except Exception as e:
            _logger.error("Error creating field: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:field_id>",
        auth="user",
        type="json",
        methods=["PUT"],
        csrf=False)
    def update_field(self, field_id, **post):
        try:
            field = request.env["asset.custom.field"].browse(field_id)
            if not field.exists():
                return {"status": "error", "message": "Field not found"}

            field.write(
                {
                    "name": post.get("name", field.name),
                    "field_type": post.get("type", field.field_type),
                    "required": post.get("required", field.required),
                }
            )
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error updating field: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:field_id>",
        auth="user",
        type="json",
        methods=["DELETE"],
        csrf=False)
    def delete_field(self, field_id, **kw):
        try:
            field = request.env["asset.custom.field"].browse(field_id)
            if not field.exists():
                return {"status": "error", "message": "Field not found"}

            field.unlink()
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error deleting field: %s", str(e))
            return {"status": "error", "message": str(e)}

    # --- create_mouvement (mise à jour des champs) ---
    @http.route(
        "/api/patrimoine/mouvements", auth="user", type="http", methods=["POST"], csrf=False)
    def create_mouvement(self, **kw):
        try:
            # 1. Lire les données JSON manuellement depuis le corps de la requête
            # Comme le type est 'http', Odoo ne le fait pas automatiquement
            data = json.loads(request.httprequest.data)
            _logger.info(f"create_mouvement (http): Données reçues: {data}")

            # 2. Vérifier les permissions
            if not request.env.user.has_group("gestion_patrimoine.group_patrimoine_admin"):
                raise AccessError(
                    "Accès refusé. Seul un administrateur peut créer des mouvements."
                )

            # 3. Préparer les valeurs pour la création du mouvement en utilisant le dictionnaire 'data'
            asset_id = data.get("asset_id")
            if not asset_id:
                raise ValidationError("Le bien concerné (asset_id) est obligatoire.")

            mouvement_vals = {
                "asset_id": int(asset_id),
                "type_mouvement": data.get("type_mouvement"),
                "date": data.get("date"),
                "motif": data.get("motif"),
                "from_location_id": (
                    int(data.get("from_location_id"))
                    if data.get("from_location_id")
                    else False
                ),
                "from_employee_id": (
                    int(data.get("from_employee_id"))
                    if data.get("from_employee_id")
                    else False
                ),
                "to_department_id": (
                    int(data.get("to_department_id"))
                    if data.get("to_department_id")
                    else False
                ),
                "to_employee_id": (
                    int(data.get("to_employee_id")) if data.get("to_employee_id") else False
                ),
                "to_location_id": (
                    int(data.get("to_location_id")) if data.get("to_location_id") else False
                ),
            }

            # 4. Créer et valider le mouvement
            new_mouvement = request.env["patrimoine.mouvement"].create(mouvement_vals)
            new_mouvement.action_valider()

            # 5. Retourner une http.Response valide
            response_data = {
                "status": "success",
                "mouvement_id": new_mouvement.id,
                "mouvement_name": new_mouvement.name,
            }
            return Response(
                json.dumps(response_data), content_type="application/json", status=200
            )

        except AccessError as e:
            _logger.error(
                "Access denied creating mouvement: %s", str(e)
            )
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                content_type="application/json",
                status=403,
            )
        except ValidationError as e:
            _logger.error(
                "Validation error creating mouvement: %s", str(e)
            )
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                content_type="application/json",
                status=400,
            )
        except Exception as e:
            _logger.error("Erreur interne lors de la création du mouvement: %s", str(e))
            request.env.cr.rollback()
            return Response(
                json.dumps(
                    {"status": "error", "message": "Une erreur interne est survenue."}
                ),
                content_type="application/json",
                status=500,
            )

    # Route pour valider un mouvement (gardez 'http' ou 'json' selon le besoin)
    @http.route(
        "/api/patrimoine/mouvements/<int:mouvement_id>/validate",
        auth="user",
        type="http",
        methods=["POST"],
        csrf=False)
    def validate_mouvement(
        self, mouvement_id, **post
    ):  # Gardez **post si pas de body JSON
        try:
            mouvement = request.env["patrimoine.mouvement"].browse(mouvement_id)
            if not mouvement.exists():
                return Response(
                    json.dumps({"status": "error", "message": "Mouvement not found"}),
                    status=404,
                    headers={"Content-Type": "application/json"},
                )

            mouvement.action_valider()
            return Response(
                json.dumps({"status": "success"}),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error validating mouvement %s: %s", mouvement_id, str(e))
            if isinstance(e, ValidationError):
                return {"status": "error", "message": e.name}
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    @http.route(
        "/api/patrimoine/items/<int:item_id>/field-values",
        auth="user",
        type="http",
        methods=["GET"])
    def get_item_field_values(self, item_id, **kw):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return Response(status=404)

            return Response(
                json.dumps(item.custom_values or {}),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error getting item field values: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:item_id>/field-values",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def save_item_field_values(self, item_id, **post):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return {"status": "error", "message": "Item not found"}

            values = post.get("values", {})
            item.write({"custom_values": values})
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error saving item field values: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/subcategories/<int:subcategory_id>/default-field-values",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def save_default_field_values(self, subcategory_id, **post):
        try:
            subcategory = request.env["asset.subcategory"].browse(subcategory_id)
            if not subcategory.exists():
                return {"status": "error", "message": "Subcategory not found"}

            # Ici vous pourriez implémenter la logique pour sauvegarder les valeurs par défaut
            # Par exemple dans un champ custom_default_values sur le modèle subcategory
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error saving default field values: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/items/<int:item_id>",
        auth="user",
        type="http",
        methods=["GET"])
    @handle_api_errors
    def get_item(self, item_id, **kw):
        """Endpoint détaillé pour usage interne"""
        item = request.env["patrimoine.asset"].browse(item_id)
        if not item.exists():
            return Response(
                json.dumps({
                    "status": "error",
                    "code": 404,
                    "message": "Item not found"
                }),
                status=404,
                headers=CORS_HEADERS
            )

        # Conversion des dates
        date_acquisition_str = (
            item.date_acquisition.strftime("%Y-%m-%d")
            if item.date_acquisition
            else None
        )

        details = {}
        if item.type == "informatique":
            details_record = request.env["patrimoine.asset.informatique"].search(
                [("asset_id", "=", item.id)], limit=1
            )
            if details_record:
                details_data = details_record.read(
                    ["marque", "modele", "numero_serie", "date_garantie_fin"]
                )[0]
                if details_data.get("date_garantie_fin"):
                    details_data["date_garantie_fin"] = details_data[
                        "date_garantie_fin"
                    ].strftime("%Y-%m-%d")
                details = details_data
        elif item.type == "vehicule":
            details_record = request.env["patrimoine.asset.vehicule"].search(
                [("asset_id", "=", item.id)], limit=1
            )
            if details_record:
                details_data = details_record.read(
                    ["immatriculation", "marque", "modele", "kilometrage"]
                )[0]
                details = details_data

        image_url = (
            f"/web/image/patrimoine.asset/{item.id}/image" if item.image else None
        )

        item_data = {
            "id": item.id,
            "name": item.name,
            "image": image_url,
            "code": item.code,
            "type": item.type,
            "location": item.location_id.name if item.location_id else None,
            "department": item.department_id.name if item.department_id else None,
            "assignedTo": item.employee_id.name if item.employee_id else None,
            "acquisitionDate": date_acquisition_str,
            "value": item.valeur_acquisition,
            "status": item.etat,
            "details": details,
            "customValues": item.custom_values or {},
        }

        return Response(
            json.dumps({
                "status": "success",
                "data": item_data
            }, default=str),
            headers=CORS_HEADERS
        )

    @http.route(
        "/api/patrimoine/assets/<int:item_id>",
        auth="user",
        type="http",
        methods=["GET"],
        csrf=False
    )
    @handle_api_errors
    def get_asset_simple(self, item_id, **kw):
        """Endpoint simplifié pour le frontend"""
        item = request.env["patrimoine.asset"].browse(item_id)
        if not item.exists():
            return Response(
                json.dumps({
                    "error": "Asset not found"
                }),
                status=404,
                headers=CORS_HEADERS
            )

        # Format minimal pour le frontend
        item_data = {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "status": item.etat,
            "category_id": item.category_id.id,
            "subcategory_id": item.subcategory_id.id,
            "location_id": item.location_id.id,
            "employee_id": item.employee_id.id,
            "department_id": item.department_id.id,
            "acquisition_date": (
                item.date_acquisition.strftime("%Y-%m-%d")
                if item.date_acquisition
                else None
            ),
            "acquisition_value": item.valeur_acquisition,
            "serial_number": item.numero_serie,
            "model": item.modele,
            "manufacturer": item.marque,
            "custom_fields": item.custom_values or {}
        }

        return Response(
            json.dumps(item_data, default=str),
            status=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )

    @http.route(
        "/api/patrimoine/assets/<int:asset_id>/print_fiche_vie",
        auth="user",
        type="http",
        methods=["GET"])
    def print_fiche_vie_pdf(self, asset_id, **kw):
        _logger.info(f"print_fiche_vie_pdf: Requête reçue pour asset ID: {asset_id}")
        try:
            # CORRECTION DÉFINITIVE : On utilise la méthode la plus standard d'Odoo pour générer un rapport.
            # Cette méthode est plus robuste et évite les erreurs d'arguments.

            report_action = request.env['ir.actions.report']
            report_name = 'gestion_patrimoine.action_report_asset_fiche_vie' # L'ID de l'action de rapport

            # On génère le PDF en appelant la méthode sur le modèle 'ir.actions.report' lui-même
            pdf_content, content_type = report_action._render_qweb_pdf(report_name, [asset_id])

            # Création de la réponse HTTP avec les bons en-têtes
            asset = request.env["patrimoine.asset"].browse(asset_id)
            report_filename = f"{asset.name or 'materiel'}_fiche_vie.pdf".replace(" ", "_")

            pdf_http_headers = [
                ("Content-Type", "application/pdf"),
                ("Content-Length", len(pdf_content)),
                ("Content-Disposition", f'inline; filename="{report_filename}"'),
            ]

            return request.make_response(pdf_content, headers=pdf_http_headers)

        except Exception as e:
            _logger.error(f"Erreur finale lors de la génération PDF pour asset {asset_id}: {str(e)}")
            return Response(
                json.dumps({"status": "error", "message": "Une erreur interne est survenue lors de la génération du PDF."}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # Endpoints pour les champs personnalisés
    @http.route(
        "/api/patrimoine/subcategories/<int:subcategory_id>/fields",
        auth="user",
        type="http",
        methods=["GET"])
    def list_fields(self, subcategory_id, **kw):
        try:
            fields = request.env["asset.custom.field"].search(
                [("subcategory_id", "=", subcategory_id)]
            )
            field_data = [
                {
                    "id": field.id,
                    "name": field.name,
                    "type": field.field_type,
                    "required": field.required,
                    "selection_values": (
                        field.selection_values.split(",")
                        if field.field_type == "selection"
                        else []
                    ),
                }
                for field in fields
            ]
            return Response(
                json.dumps(field_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing fields: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:item_id>/field-values",
        auth="user",
        type="http",
        methods=["GET"])
    def get_item_field_values(self, item_id, **kw):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return Response(status=404)

            values = item.custom_values or {}
            return Response(
                json.dumps(values), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting field values: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:item_id>/field-values",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def save_item_field_values(self, item_id, **post):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return {"status": "error", "message": "Item not found"}

            values = post.get("values", {})
            item.write({"custom_values": values})
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error saving field values: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:subcategory_id>",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def create_field(self, subcategory_id, **post):
        try:
            field_data = {
                "name": post.get("name"),
                "field_type": post.get("type"),
                "required": post.get("required", False),
                "subcategory_id": subcategory_id,
            }
            if post.get("type") == "selection":
                field_data["selection_values"] = ",".join(
                    post.get("selection_values", [])
                )

            field = request.env["asset.custom.field"].create(field_data)
            return {"status": "success", "field_id": field.id}
        except Exception as e:
            _logger.error("Error creating field: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:field_id>",
        auth="user",
        type="json",
        methods=["PUT"],
        csrf=False)
    def update_field(self, field_id, **post):
        try:
            field = request.env["asset.custom.field"].browse(field_id)
            if not field.exists():
                return {"status": "error", "message": "Field not found"}

            field_data = {
                "name": post.get("name"),
                "field_type": post.get("type"),
                "required": post.get("required", False),
            }
            if post.get("type") == "selection":
                field_data["selection_values"] = ",".join(
                    post.get("selection_values", [])
                )

            field.write(field_data)
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error updating field: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:field_id>",
        auth="user",
        type="json",
        methods=["DELETE"],
        csrf=False)
    def delete_field(self, field_id, **kw):
        try:
            field = request.env["asset.custom.field"].browse(field_id)
            if not field.exists():
                return {"status": "error", "message": "Field not found"}

            field.unlink()
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error deleting field: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/values",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def save_field_values(self, subcategoryId, values, itemId=None, **kw):
        try:
            subcategory = request.env["asset.subcategory"].browse(subcategoryId)
            if not subcategory.exists():
                return {"status": "error", "message": "Subcategory not found"}

            if itemId:
                item = request.env["patrimoine.asset"].browse(itemId)
                if not item.exists():
                    return {"status": "error", "message": "Item not found"}

                item.write({"custom_values": values})
                return {"status": "success"}
            else:
                # Sauvegarde des valeurs par défaut pour la sous-catégorie
                subcategory.write({"default_values": values})
                return {"status": "success"}

        except Exception as e:
            _logger.error("Error saving field values: %s", str(e))
            return {"status": "error", "message": str(e)}

    # --- API pour les statistiques (asset.category, asset.subcategory, patrimoine.asset) ---
    @http.route(
        [
            "/api/patrimoine/stats",  # Stats générales
            "/api/patrimoine/stats/type/<string:general_type>",  # Stats par type général
            "/api/patrimoine/stats/category/<string:subcategory_code>",  # Stats par sous-catégorie
        ],
        auth="user",
        type="http",
        methods=["GET"])

    def get_patrimoine_stats(self, general_type=None, subcategory_code=None, **kw):
        try:
            domain = []
            if (
                general_type
            ):  # Si on veut les stats pour un type général (ex: "informatique" complet)
                domain.append(("type", "=", general_type))

            # Si on veut les stats pour une SOUS-CATÉGORIE DÉTAILLÉE (ex: "ordinateurs")
            if subcategory_code:
                subcat_record = (
                    request.env["asset.subcategory"]
                    .sudo()
                    .search([("code", "=", subcategory_code)], limit=1)
                )
                if subcat_record:
                    # Filtrer les assets par l'ID de la sous-catégorie
                    domain.append(("subcategory_id", "=", subcat_record.id))
                else:
                    _logger.warning(
                        "Statistiques: Sous-catégorie '%s' non trouvée par code. Retourne des stats à zéro.",
                        subcategory_code,
                    )
                    # Retourne des stats à zéro au lieu d'un 404, c'est plus gracieux
                    return Response(
                        json.dumps(
                            {
                                "total": 0,
                                "inService": 0,
                                "inStock": 0,
                                "outOfService": 0,
                            }
                        ),
                        status=200,
                        headers={"Content-Type": "application/json"},
                    )

            stats_raw = request.env["patrimoine.asset"].read_group(
                domain, fields=["etat", "__count"], groupby=["etat"], lazy=False
            )

            total = 0
            in_service = 0
            in_stock = 0
            out_of_service = 0

            for stat in stats_raw:
                count = stat["__count"]
                total += count
                if stat["etat"] == "service":
                    in_service = count
                elif stat["etat"] == "stock":
                    in_stock = count
                elif stat["etat"] in ("hs", "reforme"):
                    out_of_service += count

            stats = {
                "total": total,
                "inService": in_service,
                "inStock": in_stock,
                "outOfService": out_of_service,
            }
            return Response(
                json.dumps(stats), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting patrimoine stats: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # --- NOUVELLE API : Statistiques par Département ---
    @http.route(
        "/api/patrimoine/stats/by_department", auth="user", type="http", methods=["GET"])
    def get_stats_by_department(self, **kw):
        try:
            # read_group pour compter les assets par département
            stats_raw = request.env["patrimoine.asset"].read_group(
                domain=[],  # Pas de filtre global pour cette stat, on veut tous les départements
                fields=["department_id", "__count"],
                groupby=["department_id"],
                lazy=False,
            )

            department_stats = []
            for stat in stats_raw:
                dept_name = (
                    stat["department_id"][1] if stat["department_id"] else "Non affecté"
                )
                department_stats.append(
                    {
                        "id": (
                            stat["department_id"][0] if stat["department_id"] else 0
                        ),  # ID du département
                        "name": dept_name,
                        "count": stat["__count"],
                    }
                )
            return Response(
                json.dumps(department_stats),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error getting stats by department: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )
    # Route pour obtenir les stats détaillées d'UN SEUL département
    @http.route('/api/patrimoine/stats/department/<int:department_id>', auth="user", type="http", methods=["GET"])
    def get_stats_for_single_department(self, department_id, **kw):
        try:
            domain = [('department_id', '=', department_id)]

            stats_raw = request.env["patrimoine.asset"].read_group(
                domain, fields=["etat"], groupby=["etat"], lazy=False
            )

            stats = {'total': 0, 'inService': 0, 'inStock': 0, 'outOfService': 0}
            for group in stats_raw:
                # La clé pour le compte est '__count'
                count = group['__count'] 
                stats['total'] += count
                if group['etat'] == 'service':
                    stats['inService'] = count
                elif group['etat'] == 'stock':
                    stats['inStock'] = count
                elif group['etat'] in ('hs', 'reforme'):
                    stats['outOfService'] += count

            return Response(json.dumps(stats), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error(f"Error getting stats for department {department_id}: {e}")
            return Response(json.dumps({'error': str(e)}), status=500)
    # --- NOUVELLE API : Statistiques par Type Général (informatique, mobilier, vehicule) ---
    @http.route(
        "/api/patrimoine/stats/by_type", auth="user", type="http", methods=["GET"])
    def get_stats_by_type(self, **kw):
        try:
            # Utilise le champ 'type' directement sur patrimoine.asset
            stats_raw = request.env["patrimoine.asset"].read_group(
                domain=[], fields=["type", "__count"], groupby=["type"], lazy=False
            )

            type_stats = []
            # CORRECTION : Utiliser la méthode correcte pour accéder aux valeurs de sélection
            type_selection_map = dict(request.env['patrimoine.asset']._fields['type'].get_description(request.env)['selection'])

            for stat in stats_raw:
                type_code = stat["type"]
                type_name = type_selection_map.get(type_code, type_code)  # Nom lisible
                type_stats.append(
                    {"code": type_code, "name": type_name, "count": stat["__count"]}
                )
            return Response(
                json.dumps(type_stats), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting stats by type: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # --- NOUVELLE API : Statistiques par Catégorie Détaillée (asset.subcategory) ---
    @http.route(
        "/api/patrimoine/stats/by_detailed_category",
        auth="user",
        type="http",
        methods=["GET"])
    def get_stats_by_detailed_category(self, **kw):
        try:
            # read_group sur 'subcategory_id'
            stats_raw = request.env["patrimoine.asset"].read_group(
                domain=[],
                fields=["subcategory_id", "__count"],
                groupby=["subcategory_id"],
                lazy=False,
            )

            detailed_category_stats = []
            for stat in stats_raw:
                subcat_id = stat["subcategory_id"][0] if stat["subcategory_id"] else 0
                subcat_name = (
                    stat["subcategory_id"][1]
                    if stat["subcategory_id"]
                    else "Non classifié"
                )
                detailed_category_stats.append(
                    {"id": subcat_id, "name": subcat_name, "count": stat["__count"]}
                )
            return Response(
                json.dumps(detailed_category_stats),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error getting stats by detailed category: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # NOUVELLE ROUTE pour lister les matériels de l'utilisateur connecté
    @http.route('/api/patrimoine/assets/user', auth='user', type='http', methods=['GET'])
    def list_assets_for_user(self, **kw):
        try:
            # On cherche l'employé correspondant à l'utilisateur connecté
            employee = request.env['hr.employee'].search([('user_id', '=', request.env.user.id)], limit=1)
            if not employee:
                # Si aucun employé n'est lié à cet utilisateur, on renvoie une liste vide
                return Response(json.dumps([]), headers={"Content-Type": "application/json"})

            # On cherche tous les matériels affectés à cet employé
            domain = [('employee_id', '=', employee.id)]
            assets = request.env['patrimoine.asset'].search(domain)

            asset_data = []
            for asset in assets:
                image_url = (
                    f"/web/image/patrimoine.asset/{asset.id}/image"
                    if asset.image
                    else None
                )
                asset_data.append({
                    'id': asset.id,
                    'name': asset.name,
                    'code': asset.code,
                    'status': asset.etat,
                    'category': asset.subcategory_id.category_id.name if asset.subcategory_id else None,
                    'image': image_url,
                    # Ajoutez d'autres champs si nécessaire
                })

            return Response(json.dumps(asset_data), headers={'Content-Type': 'application/json'})

        except Exception as e:
            _logger.error(f"Error listing assets for user {request.env.user.id}: {e}")
            return Response(json.dumps({'error': str(e)}), status=500, headers={'Content-Type': 'application/json'})

    # NOUVELLE ROUTE pour les stats de l'utilisateur connecté
    @http.route('/api/patrimoine/stats/user', auth="user", type="http", methods=["GET"])
    def get_stats_for_user(self, **kw):
        try:
            # On cherche l'employé correspondant à l'utilisateur connecté
            employee = request.env['hr.employee'].search([('user_id', '=', request.env.user.id)], limit=1)
            if not employee:
                # Si aucun employé n'est lié, on renvoie des stats vides
                return Response(json.dumps({'total': 0, 'inService': 0, 'inStock': 0, 'outOfService': 0}), headers={"Content-Type": "application/json"})

            # On filtre les matériels par l'ID de cet employé
            domain = [('employee_id', '=', employee.id)]

            stats_raw = request.env["patrimoine.asset"].read_group(
                domain, fields=["etat"], groupby=["etat"], lazy=False
            )

            stats = {'total': 0, 'inService': 0, 'inStock': 0, 'outOfService': 0}
            for group in stats_raw:
                count = group['__count']
                stats['total'] += count
                if group['etat'] == 'service':
                    stats['inService'] = count
                elif group['etat'] == 'stock':
                    stats['inStock'] = count
                elif group['etat'] in ('hs', 'reforme'):
                    stats['outOfService'] += count

            return Response(json.dumps(stats), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error(f"Error getting stats for user {request.env.user.id}: {e}")
            return Response(json.dumps({'error': str(e)}), status=500)

    # --- API pour créer une demande (utilisée par le directeur) ---
    @http.route('/api/patrimoine/demandes', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def create_demande(self, motif_demande=None, lignes=None, **kw):
        """Créer une demande de matériel avec plusieurs lignes.

        Cette route est appelée depuis le frontend. Pour éviter les erreurs de
        paramètres manquants quand l'appelant n'envoie pas les champs attendus
        ou que le payload n'est pas correctement parsé, les arguments sont
        optionnels et récupérés depuis ``kw`` si nécessaire.
        """

        if not request.env.user.has_group("gestion_patrimoine.group_patrimoine_director"):
            raise AccessError("Accès refusé.")

        motif_demande = motif_demande or kw.get('motif_demande')
        lignes = lignes or kw.get('lignes')

        if motif_demande is None or lignes is None:
            data = None
            try:
                data = request.jsonrequest
            except Exception:
                data = None
            if not data:
                body = getattr(request.httprequest, 'data', None)
                if body:
                    try:
                        if isinstance(body, bytes):
                            body = body.decode('utf-8')
                        data = json.loads(body or "{}")
                    except Exception:
                        data = None
            if isinstance(data, dict):
                motif_demande = motif_demande or data.get('motif_demande')
                lignes = lignes if lignes is not None else data.get('lignes')

        if lignes is None:
            lignes = []

        _logger.info(
            "User %s creating demande, motif=%s, lines=%s",
            request.env.user.id,
            motif_demande,
            len(lignes),
        )

        if not motif_demande or not lignes:
            _logger.error(
                "Validation failed for create_demande: motif_demande=%s, lines=%s",
                motif_demande,
                lignes,
            )
            raise ValidationError("Motif et lignes de demande requis")

        # 1. Créer la demande "header" avec le motif
        demande_vals = {
            'demandeur_id': request.env.user.id,
            'motif_demande': motif_demande,
        }
        new_demande = request.env['patrimoine.demande.materiel'].create(demande_vals)
        _logger.info("Demande created with id %s", new_demande.id)

        # 2. Parcourir et créer chaque ligne reçue
        for ligne in lignes:
            request.env['patrimoine.demande.materiel.ligne'].create({
                'demande_id': new_demande.id,
                'demande_subcategory_id': int(ligne.get('demande_subcategory_id')),
                'quantite': int(ligne.get('quantite')),
                'destinataire_department_id': int(ligne.get('destinataire_department_id')) if ligne.get('destinataire_department_id') else False,
                'destinataire_location_id': int(ligne.get('destinataire_location_id')) if ligne.get('destinataire_location_id') else False,
                'destinataire_employee_id': int(ligne.get('destinataire_employee_id')) if ligne.get('destinataire_employee_id') else False,
            })

        return Response(
            json.dumps({'status': 'success', 'demande_id': new_demande.id}),
            headers=CORS_HEADERS,
        )

    # Endpoints standardisés pour les demandes de matériel
    @http.route('/api/patrimoine/demandes/<int:demande_id>/approve', type='json', auth='user', methods=['POST'])
    def approve_demande(self, demande_id, **kw):
        try:
            if not request.env.user.has_group('gestion_patrimoine.group_patrimoine_admin'):
                return {'status': 'error', 'message': 'Accès refusé'}, 403

            demande = request.env['patrimoine.demande.materiel'].browse(demande_id)
            if not demande.exists():
                return {'status': 'error', 'message': 'Demande non trouvée'}, 404

            demande.action_approve()
            return {'status': 'success', 'new_state': demande.state}
        except Exception as e:
            _logger.error(f"Error approving demande {demande_id}: {str(e)}")
            return {'status': 'error', 'message': str(e)}, 500

    @http.route('/api/patrimoine/demandes/<int:demande_id>/reject', type='json', auth='user', methods=['POST'])
    def reject_demande(self, demande_id, **kw):
        try:
            if not request.env.user.has_group('gestion_patrimoine.group_patrimoine_admin'):
                return {'status': 'error', 'message': 'Accès refusé'}, 403

            demande = request.env['patrimoine.demande.materiel'].browse(demande_id)
            if not demande.exists():
                return {'status': 'error', 'message': 'Demande non trouvée'}, 404

            demande.action_reject()
            return {'status': 'success', 'new_state': demande.state}
        except Exception as e:
            _logger.error(f"Error rejecting demande {demande_id}: {str(e)}")
            return {'status': 'error', 'message': str(e)}, 500

    # --- API pour lister les demandes de matériel (à jour avec les nouveaux champs) ---
    @http.route("/api/patrimoine/demandes", auth="user", type="http", methods=["GET"])
    def list_demandes(self, **kw):
        try:
            current_user = request.env.user
            # Par défaut, ne montrer que les demandes en attente
            domain = [("state", "=", "pending")]
            # Les admins voient toutes les demandes
            if current_user.has_group("gestion_patrimoine.group_patrimoine_admin"):
                domain = []

            demandes = request.env["patrimoine.demande.materiel"].search(
                domain, order="create_date desc"
            )

            demande_data = []
            for demande in demandes:
                # On récupère le nom du département de l'employé qui a fait la demande
                demandeur_employee = request.env['hr.employee'].search([('user_id', '=', demande.demandeur_id.id)], limit=1)
                departement_name = demandeur_employee.department_id.name if demandeur_employee and demandeur_employee.department_id else "N/A"

                demande_data.append(
                    {
                        "id": demande.id,
                        "name": demande.name,
                        "demandeur_id": demande.demandeur_id.id,
                        "demandeur_name": demande.demandeur_id.name,
                        "departement_demandeur": departement_name,
                        "motif_demande": demande.motif_demande,
                        "state": demande.state,
                        "date_demande": (
                            demande.date_demande.strftime("%Y-%m-%d %H:%M:%S")
                            if demande.date_demande
                            else None
                        ),
                        "date_traitement": (
                            demande.date_traitement.strftime("%Y-%m-%d %H:%M:%S")
                            if demande.date_traitement
                            else None
                        ),
                        "lignes": [
                            {
                                "id": ligne.id,
                                "demande_subcategory_id": ligne.demande_subcategory_id.id,
                                "demande_subcategory_name": ligne.demande_subcategory_id.name,
                                "quantite": ligne.quantite,
                                "destinataire_department_id": (
                                    ligne.destinataire_department_id.id
                                    if ligne.destinataire_department_id
                                    else None
                                ),
                                "destinataire_department_name": (
                                    ligne.destinataire_department_id.name
                                    if ligne.destinataire_department_id
                                    else None
                                ),
                                "destinataire_location_id": (
                                    ligne.destinataire_location_id.id
                                    if ligne.destinataire_location_id
                                    else None
                                ),
                                "destinataire_location_name": (
                                    ligne.destinataire_location_id.name
                                    if ligne.destinataire_location_id
                                    else None
                                ),
                                "destinataire_employee_id": (
                                    ligne.destinataire_employee_id.id
                                    if ligne.destinataire_employee_id
                                    else None
                                ),
                                "destinataire_employee_name": (
                                    ligne.destinataire_employee_id.name
                                    if ligne.destinataire_employee_id
                                    else None
                                ),
                                "description": ligne.description,
                            }
                            for ligne in demande.ligne_ids
                        ],
                    }
                )
            return Response(
                json.dumps(demande_data), 
                headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing demandes: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # --- API pour créer une déclaration de perte (par Employé/Directeur) ---

    @http.route(
        "/api/patrimoine/pertes", auth="user", type="http", methods=["POST"], csrf=False)
    def create_perte(self, **post):
        try:
            post = request.httprequest.form.to_dict()
            current_user = request.env.user
            # L'utilisateur doit être un agent ou directeur (ou tout groupe autorisé à déclarer des pertes)
            # Cette permission est aussi gérée par ir.model.access.csv et record_rules.xml
            if not current_user.has_group(
                "gestion_patrimoine.group_patrimoine_agent"
            ) and not current_user.has_group(
                "gestion_patrimoine.group_patrimoine_director"
            ):
                raise AccessError(
                    "Accès refusé. Seuls les agents et directeurs peuvent créer des déclarations de perte."
                )

            asset_id = post.get("asset_id")
            motif = post.get("motif") or post.get("circonstances")
            date_perte = post.get("date_perte")
            lieu_perte = post.get("lieu_perte")
            circonstances = post.get("circonstances")
            actions_entreprises = post.get("actions_entreprises")
            rapport_police = post.get("rapport_police") in ("1", "true", "True", "on")

            if not asset_id or not motif:
                raise ValidationError("Asset ou motif manquant.")

            asset = request.env["patrimoine.asset"].browse(int(asset_id))
            if not asset.exists():
                raise ValidationError("Bien concerné non trouvé.")

            perte_vals = {
                "asset_id": int(asset_id),
                "motif": motif,
                "date_perte": date_perte,
                "lieu_perte": lieu_perte,
                "circonstances": circonstances,
                "actions_entreprises": actions_entreprises,
                "rapport_police": rapport_police,
                "declarer_par_id": current_user.id,
                'state': 'to_approve'
            }

            new_perte = request.env["patrimoine.perte"].create(perte_vals)
            # Déplace immédiatement la déclaration à l'état "to_approve"
            # afin qu'elle soit visible pour validation côté manager
            new_perte.action_submit()

            # Gestion du document joint (procès-verbal)
            if "document" in request.httprequest.files:
                document = request.httprequest.files["document"]
                if document:
                    request.env["ir.attachment"].create(
                        {
                            "name": document.filename,
                            "datas": base64.b64encode(document.read()),
                            "res_model": "patrimoine.perte",
                            "res_id": new_perte.id,
                            "mimetype": document.mimetype,
                        }
                    )

            return Response(
                json.dumps(
                    {
                        "status": "success",
                        "perte_id": new_perte.id,
                        "perte_name": new_perte.name,
                    },
                    default=str,
                ),
                headers=CORS_HEADERS,
            )
        except Exception as e:
            _logger.error(f"Erreur lors de la création de la déclaration de perte : {e}")
            return Response(json.dumps({'error': str(e)}), status=500, headers = CORS_HEADERS, content_type='application/json')

    # --- API pour lister les déclarations de perte ---
    @http.route("/api/patrimoine/pertes", auth="user", type="http", methods=["GET"])
    def list_pertes(self, **kw):
        try:
            # Filtrer les pertes en attente ou toutes si l'admin a les droits
            current_user = request.env.user
            domain = []

            pertes = request.env["patrimoine.perte"].search(
                domain, order="date_perte desc"
            )

            perte_data = []
            for perte in pertes:
                perte_data.append(
                    {
                        "id": perte.id,
                        "name": perte.name,  # Référence de la déclaration
                        "asset_id": perte.asset_id.id,
                        "asset_name": perte.asset_id.name,
                        "asset_code": perte.asset_id.code,
                        "date_perte": (
                            perte.date_perte.strftime("%Y-%m-%d %H:%M:%S")
                            if perte.date_perte
                            else None
                        ),
                        "motif": perte.motif,
                        "declarer_par_id": perte.declarer_par_id.id,
                        "declarer_par_name": perte.declarer_par_id.name,
                        "state": perte.state,
                        # On peut aussi ajouter les autres champs ici pour la modal "Voir"
                        "lieu_perte": perte.lieu_perte,
                        "circonstances": perte.circonstances,
                        "actions_entreprises": perte.actions_entreprises,
                        "rapport_police": perte.rapport_police,
                    }
                )
            return Response(
                json.dumps(perte_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing pertes: %s", str(e))
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # Dans asset_controller.py
    @http.route("/api/patrimoine/pertes/manager", auth="user", type="http", methods=["GET"])
    def list_pertes_for_manager(self, **kw):
        try:
            current_employee = request.env["hr.employee"].search(
                [("user_id", "=", request.env.user.id)], limit=1
            )
            if not current_employee:
                return Response(json.dumps([]), headers={"Content-Type": "application/json"})

            # Recherche des employés ayant ce manager comme supérieur hiérarchique
            employee_ids = (
                request.env["hr.employee"]
                .search([("parent_id", "=", current_employee.id)])
                .ids
            )

            # S'il n'y a pas de subordonnés directs, on récupère les employés du même département
            if not employee_ids and current_employee.department_id:
                employee_ids = (
                    request.env["hr.employee"]
                    .search([("department_id", "=", current_employee.department_id.id)])
                    .ids
                )

            # --- DÉBUT DE LA CORRECTION ---

            # 1. On récupère les enregistrements complets des employés trouvés
            employees_in_team = request.env["hr.employee"].browse(employee_ids)
            # 2. On extrait les IDs de leurs comptes utilisateurs (res.users)
            user_ids_of_team = employees_in_team.mapped('user_id').ids

            # 3. Le domaine de recherche correct
            domain = [
                ("declarer_par_id", "in", user_ids_of_team),
                ("state", "=", "to_approve"),
            ]

            # --- FIN DE LA CORRECTION ---

            pertes = request.env["patrimoine.perte"].search(domain, order="date_perte desc")

            # La logique pour formater les données reste la même
            perte_data = []
            for perte in pertes:
                perte_data.append(
                    {
                        "id": perte.id,
                        "name": perte.name,
                        "asset_name": perte.asset_id.sudo().name,
                        "declarer_par_name": perte.declarer_par_id.name,
                        "date_perte": (
                            perte.date_perte.strftime("%Y-%m-%d")
                            if perte.date_perte
                            else None
                        ),
                        "state": perte.state,
                    }
                )

            return Response(
                json.dumps(perte_data), headers={"Content-Type": "application/json"}
            )

        except Exception as e:
            _logger.error(f"Error listing pertes for manager {request.env.user.name}: {e}")
            return Response(json.dumps({'error': str(e)}), status=500, headers={'Content-Type': 'application/json'})

    # NOUVELLE ROUTE pour que le manager traite une déclaration
    @http.route(
        "/api/patrimoine/pertes/manager_process/<int:perte_id>",
        auth="user",
        type="json",
        methods=["POST"])
    def manager_process_perte(self, perte_id, action, **kw):
        try:
            perte = request.env["patrimoine.perte"].browse(perte_id)
            if not perte.exists():
                return {"status": "error", "message": "Déclaration non trouvée"}

            # On vérifie que l'utilisateur est bien le manager de l'employé déclarant
            current_employee = request.env["hr.employee"].search(
                [("user_id", "=", request.env.user.id)], limit=1
            )
            if (
                perte.declarer_par_id.employee_ids
                and perte.declarer_par_id.employee_ids[0].parent_id != current_employee
            ):
                return {"status": "error", "message": "Action non autorisée."}

            if action == "approve":
                perte.action_manager_approve()
            elif action == "reject":
                perte.action_reject()
            else:
                return {"status": "error", "message": "Action invalide"}

            return {"status": "success", "new_state": perte.state}
        except Exception as e:
            _logger.error(f"Error processing perte {perte_id} by manager: {e}")
            return {"status": "error", "message": str(e)}

    # --- API pour approuver ou rejeter une déclaration de perte ---
    @http.route(
        "/api/patrimoine/pertes/<int:perte_id>/process",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False)
    def process_perte(
        self, perte_id, action, **kw
    ):  # 'action' sera 'approve' ou 'reject'
        try:
            perte = request.env["patrimoine.perte"].browse(perte_id)
            if not perte.exists():
                return {
                    "status": "error",
                    "message": "Déclaration de perte non trouvée",
                }

            # Vérifier les permissions (Admin du patrimoine peut traiter)
            if not request.env.user.has_group(
                "gestion_patrimoine.group_patrimoine_admin"
            ):
                raise AccessError(
                    "Accès refusé. Seul un administrateur du patrimoine peut traiter les déclarations de perte."
                )

            if action == "approve":
                perte.action_approve()
            elif action == "reject":
                perte.action_reject()
            else:
                return {"status": "error", "message": "Action invalide"}

            return {"status": "success", "new_state": perte.state}
        except AccessError as e:
            _logger.error("Access denied processing perte %s: %s", perte_id, str(e))
            return {"status": "error", "message": f"Accès refusé: {e.name}"}
        except ValidationError as e:
            _logger.error("Validation error processing perte %s: %s", perte_id, str(e))
            return {"status": "error", "message": f"Erreur de validation: {e.name}"}
        except Exception as e:
            _logger.error("Error processing perte %s: %s", perte_id, str(e))
            return {"status": "error", "message": str(e)}

    @http.route('/api/patrimoine/pertes/<int:perte_id>/views', auth='user', type='http', methods=['POST'], csrf=False)
    def add_perte_view(self, perte_id, **kw):
        perte = request.env['patrimoine.perte'].sudo().browse(perte_id)
        if not perte.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Perte not found'}), status=404, headers=CORS_HEADERS)
        perte.write({'viewer_ids': [(4, request.env.user.id)]})
        return Response(json.dumps({'status': 'success'}), headers=CORS_HEADERS)

    @http.route('/api/patrimoine/pertes/unread_count', auth='user', type='http', methods=['GET'], csrf=False)
    def pertes_unread_count(self, **kw):
        count = request.env['patrimoine.perte'].sudo().search_count([
            ('viewer_ids', 'not in', request.env.user.id),
            ('manager_id.user_id', '=', request.env.user.id),
            ('state', '=', 'to_approve'),
        ])
        return Response(json.dumps({'status': 'success', 'data': {'count': count}}), headers=CORS_HEADERS)

    # --- API pour créer un signalement de panne ---
    @http.route(
    "/api/patrimoine/pannes",
    auth="user",
    type="http",
    methods=["POST"],
    csrf=False,
    )
    def create_panne(self, **post):
        _logger.info("--- API TRACE: create_panne a été appelée ---")
        try:
            # On lit les données JSON envoyées par le formulaire React
            data = json.loads(request.httprequest.data)
            _logger.info(f"Données reçues après parsing JSON: {data}")

            asset_id = data.get("asset_id")
            description = data.get("description")
            date_panne = data.get("date_panne") # Champ optionnel

            _logger.info(f"Valeurs extraites -> asset_id: {asset_id}, description: {description}")
            
            # --- Début de la logique métier ---
            
            current_user = request.env.user
            if not current_user.has_group("gestion_patrimoine.group_patrimoine_agent") and not current_user.has_group(
                "gestion_patrimoine.group_patrimoine_director"
            ):
                raise AccessError(
                    "Accès refusé. Seuls les agents et directeurs peuvent créer des signalements de panne."
                )

            if not asset_id or not description:
                _logger.error("VALIDATION ÉCHOUÉE: Asset ou description manquant.")
                raise ValidationError("Asset ou description manquant.")

            asset = request.env["patrimoine.asset"].browse(int(asset_id))
            if not asset.exists():
                raise ValidationError("Bien concerné non trouvé.")

            panne_vals = {
                "asset_id": int(asset_id),
                "description": description,
                "date_panne": date_panne or fields.Date.today(),
                "declarer_par_id": current_user.id,
                "state": "to_approve",
            }

            new_panne = request.env["patrimoine.panne"].create(panne_vals)
            
            # On suppose que cette méthode existe sur votre modèle
            if hasattr(new_panne, 'action_submit'):
                new_panne.action_submit()

            return Response(
                json.dumps({"status": "success", "panne_id": new_panne.id, "panne_name": new_panne.name}, default=str),
                headers=CORS_HEADERS,
            )

        except Exception as e:
            _logger.error(f"Erreur lors de la création du signalement de panne : {e}")
            return Response(json.dumps({'error': str(e)}), status=500, headers=CORS_HEADERS)
    # --- API pour lister les pannes ---
    @http.route("/api/patrimoine/pannes", auth="user", type="http", methods=["GET"])
    def list_pannes(self, **kw):
        try:
            pannes = request.env["patrimoine.panne"].search([], order="date_panne desc")
            data = []
            for panne in pannes:
                data.append(
                    {
                        "id": panne.id,
                        "name": panne.name,
                        "asset_id": panne.asset_id.id,
                        "asset_name": panne.asset_id.name,
                        "date_panne": panne.date_panne.strftime("%Y-%m-%d") if panne.date_panne else None,
                        "description": panne.description,
                        "declarer_par_id": panne.declarer_par_id.id,
                        "declarer_par_name": panne.declarer_par_id.name,
                        "state": panne.state,
                    }
                )
            return Response(json.dumps(data), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error("Error listing pannes: %s", str(e))
            return Response(json.dumps({"status": "error", "message": str(e)}), status=500, headers={"Content-Type": "application/json"})

    @http.route("/api/patrimoine/pannes/manager", auth="user", type="http", methods=["GET"])
    def list_pannes_for_manager(self, **kw):
        try:
            current_employee = request.env["hr.employee"].search([("user_id", "=", request.env.user.id)], limit=1)
            if not current_employee:
                return Response(json.dumps([]), headers={"Content-Type": "application/json"})

            employee_ids = request.env["hr.employee"].search([("parent_id", "=", current_employee.id)]).ids
            if not employee_ids and current_employee.department_id:
                employee_ids = request.env["hr.employee"].search([("department_id", "=", current_employee.department_id.id)]).ids

            user_ids_of_team = request.env["hr.employee"].browse(employee_ids).mapped("user_id").ids
            domain = [("declarer_par_id", "in", user_ids_of_team), ("state", "=", "to_approve")]

            pannes = request.env["patrimoine.panne"].search(domain, order="date_panne desc")
            data = []
            for panne in pannes:
                data.append(
                    {
                        "id": panne.id,
                        "name": panne.name,
                        "asset_name": panne.asset_id.sudo().name,
                        "declarer_par_name": panne.declarer_par_id.name,
                        "date_panne": panne.date_panne.strftime("%Y-%m-%d") if panne.date_panne else None,
                        "state": panne.state,
                    }
                )
            return Response(json.dumps(data), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error(f"Error listing pannes for manager {request.env.user.name}: {e}")
            return Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})

    @http.route("/api/patrimoine/pannes/manager_process/<int:panne_id>", auth="user", type="json", methods=["POST"])
    def manager_process_panne(self, panne_id, action, **kw):
        try:
            panne = request.env["patrimoine.panne"].browse(panne_id)
            if not panne.exists():
                return {"status": "error", "message": "Déclaration non trouvée"}

            current_employee = request.env["hr.employee"].search([("user_id", "=", request.env.user.id)], limit=1)
            if panne.declarer_par_id.employee_ids and panne.declarer_par_id.employee_ids[0].parent_id != current_employee:
                return {"status": "error", "message": "Action non autorisée."}

            if action == "approve":
                panne.action_manager_approve()
            elif action == "reject":
                panne.action_reject()
            else:
                return {"status": "error", "message": "Action invalide"}

            return {"status": "success", "new_state": panne.state}
        except Exception as e:
            _logger.error(f"Error processing panne {panne_id} by manager: {e}")
            return {"status": "error", "message": str(e)}

    @http.route("/api/patrimoine/pannes/<int:panne_id>/process", auth="user", type="json", methods=["POST"], csrf=False)
    def process_panne(self, panne_id, action, **kw):
        try:
            panne = request.env["patrimoine.panne"].browse(panne_id)
            if not panne.exists():
                return {"status": "error", "message": "Signalement non trouvé"}

            if not request.env.user.has_group("gestion_patrimoine.group_patrimoine_admin"):
                raise AccessError("Accès refusé. Seul un administrateur du patrimoine peut traiter les pannes.")

            if action == "approve":
                panne.action_approve()
            elif action == "reject":
                panne.action_reject()
            else:
                return {"status": "error", "message": "Action invalide"}

            return {"status": "success", "new_state": panne.state}
        except AccessError as e:
            _logger.error("Access denied processing panne %s: %s", panne_id, str(e))
            return {"status": "error", "message": f"Accès refusé: {e.name}"}
        except ValidationError as e:
            _logger.error("Validation error processing panne %s: %s", panne_id, str(e))
            return {"status": "error", "message": f"Erreur de validation: {e.name}"}
        except Exception as e:
            _logger.error("Error processing panne %s: %s", panne_id, str(e))
            return {"status": "error", "message": str(e)}

    @http.route('/api/patrimoine/pannes/<int:panne_id>/views', auth='user', type='http', methods=['POST'], csrf=False)
    def add_panne_view(self, panne_id, **kw):
        panne = request.env['patrimoine.panne'].sudo().browse(panne_id)
        if not panne.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Panne not found'}), status=404, headers=CORS_HEADERS)
        panne.write({'viewer_ids': [(4, request.env.user.id)]})
        return Response(json.dumps({'status': 'success'}), headers=CORS_HEADERS)

    @http.route('/api/patrimoine/pannes/unread_count', auth='user', type='http', methods=['GET'], csrf=False)
    def pannes_unread_count(self, **kw):
        count = request.env['patrimoine.panne'].sudo().search_count([
            ('viewer_ids', 'not in', request.env.user.id),
            ('manager_id.user_id', '=', request.env.user.id),
            ('state', '=', 'to_approve'),
        ])
        return Response(json.dumps({'status': 'success', 'data': {'count': count}}), headers=CORS_HEADERS)

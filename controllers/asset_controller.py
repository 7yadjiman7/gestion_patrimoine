from odoo import http
from odoo.http import request, Response
import json
from odoo.osv import expression
from werkzeug.exceptions import (
    BadRequest,
)  # Assurez-vous d'avoir cet import si vous utilisez BadRequest
import base64  # Pour encoder/décoder les fichiers
import logging

_logger = logging.getLogger(__name__)


class PatrimoineAssetController(http.Controller):
    @http.route("/api/patrimoine/categories", auth="user", type="http", methods=["GET"])
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

    @http.route(
        "/api/patrimoine/subcategories/<int:category_id>",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def list_subcategories(self, category_id, **kw):
        try:
            subcategories = request.env["asset.subcategory"].search(
                [("category_id", "=", category_id)]
            )
            subcategory_data = [
                {
                    "id": sub.id,
                    "name": sub.name,
                    "code": sub.code,
                    "category_id": sub.category_id.id,
                    "category_name": sub.category_id.name,
                    "category_type": sub.category_id.type,
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
                for sub in subcategories
            ]
            return Response(
                json.dumps(subcategory_data),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            _logger.error("Error listing subcategories: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:subcategory_id>",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def list_items(self, subcategory_id, **kw):
        try:
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
                json.dumps(item_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing items: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items", auth="user", type="json", methods=["POST"], csrf=False
    )
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

            # Stocker les valeurs personnalisées sous forme de JSON stringifié dans custom_values
            # Assurez-vous que patrimoine.asset a bien un champ fields.Serialized ou Text pour custom_values
            if custom_values_data:
                new_item.write({"custom_values": json.dumps(custom_values_data)})

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
                        "customValues": (
                            json.loads(asset.custom_values) if asset.custom_values else {}
                        ),
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
                        "customValues": (
                            json.loads(asset.custom_values) if asset.custom_values else {}
                        ),
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
                    "customValues": json.loads(asset.custom_values) if asset.custom_values else {}
                })
            return Response(json.dumps(asset_data), headers={"Content-Type": "application/json"})
        except Exception as e:
            _logger.error("Error listing assets by department: %s", str(e))
            return Response(json.dumps({'status': 'error', 'message': str(e)}), status=500, headers={"Content-Type": "application/json"})

    # méthode pour la création d'un asset
    @http.route(
        "/api/patrimoine/assets", auth="user", type="http", methods=["POST"], csrf=False
    )
    def create_asset(self, **post):
        _logger.info("Début de la création d'un asset")
        try:
            _logger.info("Données reçues: %s", str(request.httprequest.form))
            _logger.info("Fichiers reçus: %s", str(request.httprequest.files))

            asset_vals = {
                "name": post.get("name"),
                "type": post.get("type"),  # 'informatique', 'vehicule', 'mobilier'
                "date_acquisition": post.get("date_acquisition"),
                "valeur_acquisition": (
                    float(post.get("valeur_acquisition"))
                    if post.get("valeur_acquisition")
                    else 0.0
                ),
                "etat": post.get("etat"),
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

            # Gérer l'upload de l'image
            if (
                "image" in request.httprequest.files
                and request.httprequest.files["image"]
            ):
                image_file = request.httprequest.files["image"]
                asset_vals["image"] = base64.b64encode(
                    image_file.read()
                )  # Lire le contenu et l'encoder en base64

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

            # Création de l'asset principal
            asset = request.env["patrimoine.asset"].create(asset_vals)

            # Gérer les détails spécifiques (informatique, véhicule, mobilier)
            # Les données spécifiques sont envoyées comme 'specific_data[champ_specifique]'
            specific_data = {}
            for key, value in post.items():
                if key.startswith("specific_data["):
                    field_name = key[len("specific_data[") : -1]
                    specific_data[field_name] = value

            if asset.type == "informatique":
                request.env["patrimoine.asset.informatique"].create(
                    {
                        "asset_id": asset.id,
                        "categorie_materiel": specific_data.get("categorie_materiel"),
                        "marque": specific_data.get("marque"),
                        "modele": specific_data.get("modele"),
                        "numero_serie": specific_data.get("numero_serie"),
                        "date_garantie_fin": specific_data.get("date_garantie_fin"),
                    }
                )
            elif asset.type == "vehicule":
                request.env["patrimoine.asset.vehicule"].create(
                    {
                        "asset_id": asset.id,
                        "immatriculation": specific_data.get("immatriculation"),
                        "marque": specific_data.get("marque"),
                        "modele": specific_data.get("modele"),
                        "kilometrage": (
                            float(specific_data.get("kilometrage"))
                            if specific_data.get("kilometrage")
                            else 0.0
                        ),
                        # Note: date_achat, date_premiere_circulation, date_assurance, date_controle_technique
                        # Ne sont pas dans votre formulaire React actuel pour les véhicules,
                        # mais il faudrait les ajouter ici si vous les mettez dans le formulaire.
                    }
                )
            elif asset.type == "mobilier":
                request.env["patrimoine.asset.mobilier"].create(
                    {
                        "asset_id": asset.id,
                        "categorie_mobilier": specific_data.get("categorie_mobilier"),
                        "etat_conservation": specific_data.get("etat_conservation"),
                    }
                )

            # Retourner une réponse de succès
            return Response(
                json.dumps({"status": "success", "asset_id": asset.id}),
                headers={"Content-Type": "application/json"},
            )

        except Exception as e:
            _logger.error("Error creating asset: %s", str(e))
            # Retourner une erreur 500 avec un message pour le frontend
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    @http.route(
        "/api/patrimoine/assets/<int:asset_id>",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def get_asset(self, asset_id, **kw):
        try:
            asset = request.env["patrimoine.asset"].browse(asset_id)
            if not asset.exists():
                return Response(status=404)

            # 3. Conversion de la date d'acquisition de l'asset principal (pour get_asset)
            date_acquisition_str = (
                asset.date_acquisition.strftime("%Y-%m-%d")
                if asset.date_acquisition
                else None
            )

            details = {}
            if asset.type == "informatique":
                details_record = request.env["patrimoine.asset.informatique"].search(
                    [("asset_id", "=", asset.id)], limit=1
                )
                if details_record:
                    details_data = details_record.read(
                        [
                            "marque",
                            "modele",
                            "numero_serie",
                            "date_garantie_fin",
                            "fournisseur",
                        ]
                    )[0]
                    if (
                        "date_garantie_fin" in details_data
                        and details_data["date_garantie_fin"]
                    ):
                        details_data["date_garantie_fin"] = details_data[
                            "date_garantie_fin"
                        ].strftime("%Y-%m-%d")
                    details = details_data
            elif asset.type == "vehicule":
                details_record = request.env["patrimoine.asset.vehicule"].search(
                    [("asset_id", "=", asset.id)], limit=1
                )
                if details_record:
                    details_data = details_record.read(
                        [
                            "immatriculation",
                            "marque",
                            "modele",
                            "kilometrage",
                            "date_achat",
                            "date_premiere_circulation",
                            "date_assurance",
                            "date_controle_technique",
                            "kilometrage_precedent",
                        ]
                    )[0]
                    # 4. Conversion de toutes les dates spécifiques aux véhicules (pour get_asset)
                    for date_field in [
                        "date_achat",
                        "date_premiere_circulation",
                        "date_assurance",
                        "date_controle_technique",
                    ]:
                        if date_field in details_data and details_data[date_field]:
                            details_data[date_field] = details_data[
                                date_field
                            ].strftime("%Y-%m-%d")
                    details = details_data
            elif asset.type == "mobilier":
                details_record = request.env["patrimoine.asset.mobilier"].search(
                    [("asset_id", "=", asset.id)], limit=1
                )
                if details_record:
                    details_data = details_record.read(
                        ["categorie_mobilier", "etat_conservation"]
                    )[0]
                    details = details_data
            image_url = False
            if asset.image:
                image_url = f"/web/image/patrimoine.asset/{asset.id}/image"

            asset_data = {
                "id": asset.id,
                "name": asset.name,
                "image": image_url,  # <-- Ajoutez l'URL de l'image ici
                "code": asset.code,
                "type": asset.type,
                "location": asset.location_id.name if asset.location_id else None,
                "category": (
                    asset.subcategory_id.category_id.name
                    if asset.subcategory_id and asset.subcategory_id.category_id
                    else None
                ),
                "acquisitionDate": date_acquisition_str,  # <-- CORRECTION MAJEURE : UTILISER LA CHAÎNE DE CARACTÈRES
                "value": asset.valeur_acquisition,
                "status": asset.etat,
                "assignedTo": asset.employee_id.name if asset.employee_id else None,
                "details": details,  # Ce dictionnaire 'details' doit maintenant contenir toutes les dates converties
            }
            return Response(
                json.dumps(asset_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting asset details: %s", str(e))
            return Response(status=500)

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
            employee_data = [{"id": emp.id, "name": emp.name} for emp in employees]
            return Response(
                json.dumps(employee_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error listing employees: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/departments", auth="user", type="http", methods=["GET"]
    )
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
        "/api/patrimoine/fournisseurs", auth="user", type="http", methods=["GET"]
    )
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
        type="http",
        methods=["GET"],
    )
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
        "/api/patrimoine/fields/<int:subcategory_id>",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
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
        csrf=False,
    )
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
        csrf=False,
    )
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
        "/api/patrimoine/mouvements",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
    def create_mouvement(
        self,
        asset_id,
        type_mouvement,
        date,
        quantite,  # <-- AJOUTÉ ICI pour la cohérence
        motif,  # <-- AJOUTÉ ICI (votre champ motif)
        demande_location_id=False,  # <-- NOUVEAU PARAMÈTRE
        demande_employee_id=False,  # <-- NOUVEAU PARAMÈTRE
        demande_department_id=False,  # <-- NOUVEAU PARAMÈTRE
        **kw,  # Garde **kw si d'autres params non listés
    ):
        # <-- NOUVEAUX LOGS ICI (au début de la fonction)
        _logger.info(
            f"create_mouvement: Arguments reçus: asset_id={asset_id}, type_mouvement={type_mouvement}, date={date}, to_employee_id={to_employee_id}, to_location_id={to_location_id}, motif={motif}, to_department_id={to_department_id}"
        )
        _logger.info(
            f"create_mouvement: Type de to_employee_id: {type(to_employee_id)}"
        )

        try:
            # Vérifier que le demandeur est un directeur ou a les droits de créer des demandes
            if not request.env.user.has_group(
                "gestion_patrimoine.group_patrimoine_director"
            ):
                raise AccessError(
                    "Accès refusé. Seul un directeur peut créer des demandes."
                )

            mouvement_vals = {
                "asset_id": int(asset_id) if asset_id else False,
                "type_mouvement": type_mouvement,
                "date": date,
                "quantite": int(quantite),  # <-- AJOUTÉ
                "motif": motif,  # <-- AJOUTÉ
                "from_location_id": False,  # Si non pertinent ou déduit autrement
                "from_employee_id": False,  # Si non pertinent ou déduit autrement
                "to_department_id": (
                    int(demande_department_id) if demande_department_id else False
                ),  # Récupère le nouveau champ
                "to_employee_id": (
                    int(demande_employee_id) if demande_employee_id else False
                ),  # Récupère le nouveau champ
                "to_location_id": (
                    int(demande_location_id) if demande_location_id else False
                ),  # Récupère le nouveau champ
            }
            new_mouvement = request.env["patrimoine.mouvement"].create(mouvement_vals)
            # Pas de action_valider ici pour le mouvement, car le gestionnaire va le valider lui-même
            # C'est une demande qui génère un mouvement, pas le mouvement lui-même.
            # La redirection vers AdminMouvement se fera après l'acceptation de la demande.

            return {
                "status": "success",
                "mouvement_id": new_mouvement.id,
                "mouvement_name": new_mouvement.name,
            }

        except AccessError as e:
            _logger.error("Access denied creating mouvement: %s", str(e))
            return {"status": "error", "message": f"Accès refusé: {e.name}"}
        except ValidationError as e:
            _logger.error("Validation error creating mouvement: %s", str(e))
            return {"status": "error", "message": f"Erreur de validation: {e.name}"}
        except Exception as e:
            _logger.error("Error creating mouvement: %s", str(e))
            return {"status": "error", "message": str(e)}

    # Route pour valider un mouvement (gardez 'http' ou 'json' selon le besoin)
    @http.route(
        "/api/patrimoine/mouvements/<int:mouvement_id>/validate",
        auth="user",
        type="http",
        methods=["POST"],
        csrf=False,
    )
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

    # Endpoints pour la gestion des champs personnalisés
    @http.route(
        "/api/patrimoine/subcategories/<int:subcategory_id>/fields",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def get_subcategory_fields(self, subcategory_id, **kw):
        try:
            subcategory = request.env["asset.subcategory"].browse(subcategory_id)
            if not subcategory.exists():
                return Response(status=404)

            fields_data = [
                {
                    "id": field.id,
                    "name": field.name,
                    "type": field.field_type,
                    "required": field.required,
                }
                for field in subcategory.custom_field_ids
            ]

            return Response(
                json.dumps(fields_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting subcategory fields: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:item_id>/field-values",
        auth="user",
        type="http",
        methods=["GET"],
    )
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
        csrf=False,
    )
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
        csrf=False,
    )
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
        methods=["GET"],
    )
    def get_item(self, item_id, **kw):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return Response(status=404)

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
                "customValues": (
                    json.loads(item.custom_values) if item.custom_values else {}
                ),
            }
            return Response(
                json.dumps(item_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting item: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/items/<int:item_id>",
        auth="user",
        type="json",
        methods=["PUT"],
        csrf=False,
    )
    def update_item(self, item_id, **post):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return {"status": "error", "message": "Item not found"}

            vals = {
                "name": post.get("name", item.name),
                "department_id": post.get(
                    "department_id",
                    item.department_id.id if item.department_id else False,
                ),
                "employee_id": post.get(
                    "employee_id", item.employee_id.id if item.employee_id else False
                ),
                "location_id": post.get(
                    "location_id", item.location_id.id if item.location_id else False
                ),
                "etat": post.get("status", item.etat),
                "custom_values": json.dumps(
                    post.get(
                        "custom_values",
                        json.loads(item.custom_values) if item.custom_values else {},
                    )
                ),
            }

            if "image" in request.httprequest.files:
                image_file = request.httprequest.files["image"]
                vals["image"] = base64.b64encode(image_file.read())

            item.write(vals)

            # Mettre à jour les détails spécifiques si nécessaire
            if item.type == "informatique":
                details = request.env["patrimoine.asset.informatique"].search(
                    [("asset_id", "=", item.id)], limit=1
                )
                if details:
                    details.write(
                        {
                            "marque": post.get("marque", details.marque),
                            "modele": post.get("modele", details.modele),
                            "numero_serie": post.get(
                                "numero_serie", details.numero_serie
                            ),
                            "date_garantie_fin": post.get(
                                "date_garantie_fin", details.date_garantie_fin
                            ),
                        }
                    )

            return {"status": "success"}
        except Exception as e:
            _logger.error("Error updating item: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/items/<int:item_id>",
        auth="user",
        type="json",
        methods=["DELETE"],
        csrf=False,
    )
    def delete_item(self, item_id, **kw):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return {"status": "error", "message": "Item not found"}

            # Créer une entrée dans la fiche de vie avant suppression
            request.env["patrimoine.fiche.vie"].create(
                {
                    "asset_id": item.id,
                    "action": "suppression",
                    "description": f"Suppression de l'item {item.name}",
                    "utilisateur_id": request.env.uid,
                }
            )

            item.unlink()
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error deleting item: %s", str(e))
            return {"status": "error", "message": str(e)}

        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return Response(status=404)

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
                "customValues": (
                    json.loads(item.custom_values) if item.custom_values else {}
                ),
            }
            return Response(
                json.dumps(item_data), headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            _logger.error("Error getting item: %s", str(e))
            return Response(status=500)

    @http.route(
        "/api/patrimoine/assets/<int:asset_id>/print_fiche_vie",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def print_fiche_vie_pdf(self, asset_id, **kw):
        _logger.info(f"print_fiche_vie_pdf: Requête reçue pour asset ID: {asset_id}")
        try:
            asset = request.env["patrimoine.asset"].browse(asset_id)
            if not asset.exists():
                _logger.warning(f"print_fiche_vie_pdf: Asset {asset_id} non trouvé.")
                return request.not_found()

            _logger.info(
                f"print_fiche_vie_pdf: Asset trouvé: {asset.name} ({asset.id})"
            )

            report_xml_id = "gestion_patrimoine.action_report_asset_fiche_vie"
            _logger.info(
                f"print_fiche_vie_pdf: Tentative de récupération du rapport avec ID externe: {report_xml_id}"
            )

            # --- Logs supplémentaires pour diagnostiquer request.env.ref ---
            try:
                report_sudo = request.env.ref(report_xml_id).sudo()
                _logger.info(
                    f"print_fiche_vie_pdf: RAPPORT TROUVÉ. Nom du rapport: {report_sudo.name} (ID: {report_sudo.id})"
                )
            except ValueError as ve:
                _logger.error(
                    f"print_fiche_vie_pdf: ÉCHEC DE RÉCUPÉRATION DU RAPPORT (ValueError): {ve}"
                )
                # Tenter de chercher dans ir.model.data pour voir si l'ID existe mais n'est pas un rapport
                ir_model_data_rec = (
                    request.env["ir.model.data"]
                    .sudo()
                    .search(
                        [
                            ("module", "=", "gestion_patrimoine"),
                            ("name", "=", "action_report_asset_fiche_vie"),
                        ],
                        limit=1,
                    )
                )
                if ir_model_data_rec:
                    _logger.error(
                        f"print_fiche_vie_pdf: L'ID externe existe dans ir.model.data, mais n'est pas un ir.actions.report valide. Modèle associé: {ir_model_data_rec.model}, Res ID: {ir_model_data_rec.res_id}"
                    )
                else:
                    _logger.error(
                        "print_fiche_vie_pdf: L'ID externe n'existe même pas dans ir.model.data."
                    )
                raise  # Relance l'erreur pour qu'elle soit attrapée par le bloc outer except
            # --- Fin des logs supplémentaires ---

            # Générer le PDF
            pdf_content, content_type = report_sudo._render_qweb_pdf(asset.id)
            _logger.info(
                f"print_fiche_vie_pdf: PDF généré avec succès pour asset {asset.id}. Taille: {len(pdf_content)} bytes."
            )

            pdf_http_headers = [
                ("Content-Type", "application/pdf"),
                ("Content-Length", len(pdf_content)),
                (
                    "Content-Disposition",
                    'inline; filename="%s_fiche_vie.pdf"'
                    % (asset.name.replace(" ", "_")),
                ),
            ]
            return request.make_response(pdf_content, pdf_http_headers)

        except Exception as e:
            _logger.error(
                "print_fiche_vie_pdf: Erreur finale lors de la génération PDF pour asset %s: %s",
                asset_id,
                str(e),
            )
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # Endpoints pour les champs personnalisés
    @http.route(
        "/api/patrimoine/subcategories/<int:subcategory_id>/fields",
        auth="user",
        type="http",
        methods=["GET"],
    )
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
        methods=["GET"],
    )
    def get_item_field_values(self, item_id, **kw):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return Response(status=404)

            values = json.loads(item.custom_values) if item.custom_values else {}
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
        csrf=False,
    )
    def save_item_field_values(self, item_id, **post):
        try:
            item = request.env["patrimoine.asset"].browse(item_id)
            if not item.exists():
                return {"status": "error", "message": "Item not found"}

            values = post.get("values", {})
            item.write({"custom_values": json.dumps(values)})
            return {"status": "success"}
        except Exception as e:
            _logger.error("Error saving field values: %s", str(e))
            return {"status": "error", "message": str(e)}

    @http.route(
        "/api/patrimoine/fields/<int:subcategory_id>",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
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
        csrf=False,
    )
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
        csrf=False,
    )
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
        csrf=False,
    )
    def save_field_values(self, subcategoryId, values, itemId=None, **kw):
        try:
            subcategory = request.env["asset.subcategory"].browse(subcategoryId)
            if not subcategory.exists():
                return {"status": "error", "message": "Subcategory not found"}

            if itemId:
                item = request.env["patrimoine.asset"].browse(itemId)
                if not item.exists():
                    return {"status": "error", "message": "Item not found"}

                item.write({"custom_values": json.dumps(values)})
                return {"status": "success"}
            else:
                # Sauvegarde des valeurs par défaut pour la sous-catégorie
                subcategory.write({"default_values": json.dumps(values)})
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
        methods=["GET"],
    )

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
        "/api/patrimoine/stats/by_department", auth="user", type="http", methods=["GET"]
    )
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

    # --- NOUVELLE API : Statistiques pour un Département donné ---
    @http.route(
        "/api/patrimoine/stats/department/<int:dept_id>",
        auth="user",
        type="http",
        methods=["GET"],
    )
    def get_stats_for_department(self, dept_id, **kw):
        try:
            domain = [("department_id", "=", dept_id)]

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
            _logger.error(
                "Error getting stats for department %s: %s", dept_id, str(e)
            )
            return Response(
                json.dumps({"status": "error", "message": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"},
            )

    # --- NOUVELLE API : Statistiques par Type Général (informatique, mobilier, vehicule) ---
    @http.route(
        "/api/patrimoine/stats/by_type", auth="user", type="http", methods=["GET"]
    )
    def get_stats_by_type(self, **kw):
        try:
            # Utilise le champ 'type' directement sur patrimoine.asset
            stats_raw = request.env["patrimoine.asset"].read_group(
                domain=[], fields=["type", "__count"], groupby=["type"], lazy=False
            )

            type_stats = []
            # CORRECTION MAJEURE ICI : Appeler la méthode .selection() pour obtenir la liste des tuples
            type_selection_map = dict(request.env['patrimoine.asset']._fields['type'].selection()) 

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
        methods=["GET"],
    )
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

    # --- API pour créer une demande (utilisée par le directeur) ---
    @http.route(
        "/api/patrimoine/demandes",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
    def create_demande(
        self,
        demande_subcategory_id=False,
        demande_location_id=False,
        demande_employee_id=False,
        demande_department_id=False,
        **kw,
    ):
        try:
            # Vérifier que le demandeur est un directeur ou a les droits de créer des demandes
            if not request.env.user.has_group(
                "gestion_patrimoine.group_patrimoine_director"
            ):
                raise AccessError(
                    "Accès refusé. Seul un directeur peut créer des demandes."
                )

            # 1. Créer la demande "header"
            demande_vals = {
                'demandeur_id': request.env.user.id,
                'motif_demande': motif_demande,
            }
            new_demande = request.env['patrimoine.demande.materiel'].create(demande_vals)

            # 2. Parcourir les lignes reçues et les créer
            lignes_a_creer = []
            for ligne in lignes:
                lignes_a_creer.append({
                    'demande_id': new_demande.id, # Lien vers la demande principale
                    'demande_subcategory_id': int(ligne.get('demande_subcategory_id')),
                    'quantite': int(ligne.get('quantite')),
                    'destinataire_location_id': int(ligne.get('destinataire_location_id')) if ligne.get('destinataire_location_id') else False,
                    'destinataire_employee_id': int(ligne.get('destinataire_employee_id')) if ligne.get('destinataire_employee_id') else False,
                    'description': ligne.get('description', '')
                })
            
            request.env['patrimoine.demande.materiel.ligne'].create(lignes_a_creer)

            return {
                "status": "success",
                "demande_id": new_demande.id,
                "demande_name": new_demande.name,
            }
        except Exception as e:
            _logger.error("Error creating demande: %s", str(e))
            # Important: si une erreur survient, annuler la transaction
            request.env.cr.rollback()
            return {"status": "error", "message": str(e)}

    # --- API pour lister les demandes de matériel (à jour avec les nouveaux champs) ---
    @http.route("/api/patrimoine/demandes", auth="user", type="http", methods=["GET"])
    def list_demandes(self, **kw):
        try:
            current_user = request.env.user
            domain = []

            # Si l'utilisateur n'est pas admin, il ne voit que ses propres demandes ou celles de son département
            # Cette logique est mieux gérée par ir.rule pour la sécurité Odoo native
            # mais on peut ajouter un pré-filtrage ici si nécessaire pour la performance de l'API.

            demandes = request.env["patrimoine.demande.materiel"].search(
                domain, order="create_date desc"
            )

            demande_data = []
            for demande in demandes:
                demande_data.append(
                    {
                        "id": demande.id,
                        "name": demande.name,
                        "demandeur_id": demande.demandeur_id.id,
                        "demandeur_name": demande.demandeur_id.name,
                        "demandeur_department": (
                            demande.demandeur_department_id.name
                            if demande.demandeur_department_id
                            else None
                        ),
                        "demande_type_general": demande.demande_type_general,
                        "demande_subcategory_id": (
                            demande.demande_subcategory_id.id
                            if demande.demande_subcategory_id
                            else None
                        ),
                        "demande_subcategory_name": (
                            demande.demande_subcategory_id.name
                            if demande.demande_subcategory_id
                            else None
                        ),
                        "quantite": demande.quantite,
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
                        "demande_location_id": (
                            demande.demande_location_id.id
                            if demande.demande_location_id
                            else None
                        ),  # NOUVEAU
                        "demande_location_name": (
                            demande.demande_location_id.name
                            if demande.demande_location_id
                            else None
                        ),  # NOUVEAU
                        "demande_employee_id": (
                            demande.demande_employee_id.id
                            if demande.demande_employee_id
                            else None
                        ),  # NOUVEAU
                        "demande_employee_name": (
                            demande.demande_employee_id.name
                            if demande.demande_employee_id
                            else None
                        ),  # NOUVEAU
                        "demande_department_id": (
                            demande.demande_department_id.id
                            if demande.demande_department_id
                            else None
                        ),  # NOUVEAU
                        "demande_department_name": (
                            demande.demande_department_id.name
                            if demande.demande_department_id
                            else None
                        ),  # NOUVEAU
                    }
                )
            return Response(
                json.dumps(demande_data), headers={"Content-Type": "application/json"}
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
        "/api/patrimoine/pertes", auth="user", type="json", methods=["POST"], csrf=False
    )
    def create_perte(self, asset_id, motif, **kw):  # Prend l'asset_id et le motif
        try:
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

            # Vérifier que l'asset existe
            asset = request.env["patrimoine.asset"].browse(int(asset_id))
            if not asset.exists():
                raise ValidationError("Bien concerné non trouvé.")

            perte_vals = {
                "asset_id": int(asset_id),
                "motif": motif,
                "declarer_par_id": current_user.id,  # L'utilisateur courant est le déclarant
                "date": fields.Datetime.now(),  # La date est par défaut dans le modèle
                "state": "pending",  # Par défaut 'pending'
            }
            new_perte = request.env["patrimoine.perte"].create(perte_vals)
            return {
                "status": "success",
                "perte_id": new_perte.id,
                "perte_name": new_perte.name,
            }
        except AccessError as e:
            _logger.error("Access denied creating perte: %s", str(e))
            return {"status": "error", "message": f"Accès refusé: {e.name}"}
        except ValidationError as e:
            _logger.error("Validation error creating perte: %s", str(e))
            return {"status": "error", "message": f"Erreur de validation: {e.name}"}
        except Exception as e:
            _logger.error("Error creating perte: %s", str(e))
            return {"status": "error", "message": str(e)}

    # --- API pour lister les déclarations de perte ---
    @http.route("/api/patrimoine/pertes", auth="user", type="http", methods=["GET"])
    def list_pertes(self, **kw):
        try:
            # Filtrer les pertes en attente ou toutes si l'admin a les droits
            current_user = request.env.user
            domain = []

            pertes = request.env["patrimoine.perte"].search(domain, order="date desc")

            perte_data = []
            for perte in pertes:
                perte_data.append(
                    {
                        "id": perte.id,
                        "name": perte.name,  # Référence de la déclaration
                        "asset_id": perte.asset_id.id,
                        "asset_name": perte.asset_id.name,
                        "asset_code": perte.asset_id.code,
                        "date": (
                            perte.date.strftime("%Y-%m-%d %H:%M:%S")
                            if perte.date
                            else None
                        ),
                        "motif": perte.motif,
                        "declarer_par_id": perte.declarer_par_id.id,
                        "declarer_par_name": perte.declarer_par_id.name,
                        "state": perte.state,
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

    # --- API pour confirmer ou rejeter une déclaration de perte ---
    @http.route(
        "/api/patrimoine/pertes/<int:perte_id>/process",
        auth="user",
        type="json",
        methods=["POST"],
        csrf=False,
    )
    def process_perte(
        self, perte_id, action, **kw
    ):  # 'action' sera 'confirm' ou 'reject'
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

            if action == "confirm":
                perte.action_confirm()
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


headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Openerp-Session-Id",
}

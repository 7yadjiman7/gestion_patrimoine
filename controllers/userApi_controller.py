# Dans un de vos fichiers contrôleur Odoo, par exemple asset_controller.py
from odoo import http
from odoo.http import request, Response
import json
import logging

_logger = logging.getLogger(__name__)


class UserApiController(http.Controller):

    @http.route("/api/users/me", type="http", auth="user", methods=["POST"], csrf=False)
    def get_current_user_info(self, **kw):
        """
        Retourne les informations de l'utilisateur courant, y compris ses rôles.
        """
        user = request.env.user

        # Déterminez les rôles en fonction des groupes de sécurité Odoo
        # Assurez-vous que les noms des groupes correspondent à ceux dans vos fichiers XML
        roles = []
        if user.has_group("gestion_patrimoine.group_patrimoine_admin"):
            roles.append("admin_patrimoine")
        if user.has_group("gestion_patrimoine.group_patrimoine_director"):
            roles.append("director")
        if user.has_group("gestion_patrimoine.group_patrimoine_manager"):
            roles.append("manager")
        if user.has_group("gestion_patrimoine.group_patrimoine_agent"):
            roles.append("agent")

        # Si aucun rôle spécifique n'est trouvé, assigner un rôle par défaut
        if not roles and user.has_group("base.group_user"):
            roles.append("user")

        # Récupère éventuellement l'employé lié à l'utilisateur pour obtenir son département
        employee = request.env["hr.employee"].search(
            [("user_id", "=", user.id)], limit=1
        )
        department_id = (
            employee.department_id.id if employee and employee.department_id else None
        )
        department_name = (
            employee.department_id.name if employee and employee.department_id else None
        )

        user_info = {
            "uid": user.id,
            "name": user.name,
            "username": user.login,
            "roles": roles,
            "department_id": department_id,
            "department_name": department_name,
        }

        # Pour un type='http', il faut retourner une odoo.http.Response
        return http.Response(json.dumps(user_info), content_type="application/json")

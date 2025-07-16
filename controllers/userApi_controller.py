from odoo import http
from odoo.http import request, Response as OdooResponse
import json
import logging
from .common import CORS_HEADERS


def Response(*args, **kwargs):
    headers = kwargs.pop("headers", {})
    headers = {**CORS_HEADERS, **headers}
    return OdooResponse(*args, headers=headers, **kwargs)

_logger = logging.getLogger(__name__)


class UserApiController(http.Controller):

    @http.route("/api/users/me", auth="user", type="json", methods=["POST"], csrf=False)
    def get_user_info(self, **kw):
        """
        Retourne les informations détaillées de l'utilisateur connecté,
        y compris ses rôles et son département.
        """
        user = request.env.user

        # Recherche de l'employé lié à l'utilisateur
        employee = request.env["hr.employee"].search(
            [("user_id", "=", user.id)], limit=1
        )

        # Détermination des rôles
        roles = []
        if user.has_group("gestion_patrimoine.group_patrimoine_admin"):
            roles.append("admin_patrimoine")
        elif user.has_group("base.group_system"):
            roles.append("admin")

        if user.has_group("gestion_patrimoine.group_patrimoine_director"):
            roles.append("director")

        if user.has_group("gestion_patrimoine.group_patrimoine_agent"):
            roles.append("agent")

        if not roles:
            roles.append("user")

        # Construction de la réponse finale
        user_data = {
            "uid": user.id,
            "name": user.name,
            "username": user.login,
            "roles": roles,
            "department_id": (
                employee.department_id.id
                if employee and employee.department_id
                else None
            ),
            "department_name": (
                employee.department_id.name
                if employee and employee.department_id
                else None
            ),
        }

        # Pour une route de type 'json', on retourne directement le dictionnaire
        return user_data

# Dans votre fichier de contrôleur, ex: userApi_controller.py

from odoo import http
from odoo.http import request


class UserApiController(http.Controller):

    @http.route("/api/users/me", auth="user", type="json", methods=["POST"], csrf=False)
    def get_user_info(self, **kw):
        """
        Retourne les informations détaillées de l'utilisateur connecté,
        y compris son rôle et son département.
        """
        user = request.env.user
        # Recherche de l'employé lié à l'utilisateur pour trouver le département
        employee = request.env["hr.employee"].search(
            [("user_id", "=", user.id)], limit=1
        )

        # Détermination des rôles de l'utilisateur pour le frontend
        roles = []
        if user.has_group("gestion_patrimoine.group_patrimoine_admin"):
            roles.append("admin")
        if user.has_group("gestion_patrimoine.group_patrimoine_director"):
            roles.append("director")
        if user.has_group("gestion_patrimoine.group_patrimoine_agent"):
            roles.append("agent")
        if not roles:
            roles.append("user")  # Rôle par défaut

        user_data = {
            "uid": user.id,
            "name": user.name,
            "username": user.login,
            "roles": roles,
            # --- AJOUTS CRUCIAUX ---
            # On ajoute l'ID et le nom du département à la réponse
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
        return user_data

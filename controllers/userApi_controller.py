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

        # 1. Déterminer les rôles de l'utilisateur
        roles = []
        if user.has_group("gestion_patrimoine.group_patrimoine_admin"):
            roles.append("admin_patrimoine")
        # On vérifie aussi le groupe admin système de base d'Odoo
        elif user.has_group("base.group_system"):
            roles.append("admin")

        if user.has_group("gestion_patrimoine.group_patrimoine_director"):
            roles.append("director")

        if user.has_group("gestion_patrimoine.group_patrimoine_agent"):
            roles.append("agent")

        if not roles:
            roles.append("user")  # Rôle par défaut

        # 2. Récupérer l'employé lié à l'utilisateur pour obtenir son département
        employee = request.env["hr.employee"].search(
            [("user_id", "=", user.id)], limit=1
        )

        # 3. Construire la réponse JSON finale
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

        # Pour une route de type "json", on retourne directement le dictionnaire. Odoo s'occupe du reste.
        return user_data

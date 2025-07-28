import json
import base64
import logging
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError

from .common import Response, handle_api_errors, CORS_HEADERS, json_response

_logger = logging.getLogger(__name__)

class IntranetPostController(http.Controller):

    @http.route('/api/intranet/posts', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def list_posts(self, user_id=None, **kwargs): # <-- 1. On accepte le paramètre user_id
        domain = [] # <-- 2. On prépare un domaine de recherche dynamique

        # 3. Si un user_id est fourni dans l'URL, on l'ajoute au filtre
        if user_id:
            try:
                domain.append(('user_id', '=', int(user_id)))
            except (ValueError, TypeError):
                # Ignore les user_id invalides pour ne pas planter
                pass

        # 4. On utilise le domaine (vide ou avec filtre) pour la recherche
        posts = request.env['intranet.post'].sudo().search(domain, order='create_date desc')

        # Le reste de la fonction ne change pas
        result = []
        session_user_id = request.env.user.id
        for post in posts:
            liked = any(l.user_id.id == session_user_id for l in post.like_ids)
            result.append({
                'id': post.id,
                'title': post.name,
                'body': post.body,
                'author': post.user_id.name,
                'author_id': post.user_id.id,
                'create_date': post.create_date,
                'type': post.post_type,
                'image': f"/web/image/intranet.post/{post.id}/image" if post.image else None,
                'attachments': [
                    {'id': att.id, 'name': att.name, 'url': f"/web/content/{att.id}?download=1"}
                    for att in post.attachment_ids
                ],
                'like_count': len(post.like_ids),
                'comment_count': len([c for c in post.comment_ids if not c.parent_id]),
                'view_count': post.view_count,
                'liked': liked,
            })
        return Response(
            json.dumps({'status': 'success', 'data': result}, default=str),
            headers=CORS_HEADERS,
        )

    @http.route(
        "/api/intranet/posts", auth="user", type="http", methods=["POST"], csrf=False)
    @handle_api_errors
    def create_post(self, **kwargs):  # On utilise **kwargs pour être flexible
        _logger.info("--- DÉBUT DE create_post ---")

        # --- CORRECTION FINALE : On lit les données directement depuis la requête http ---
        # Cette méthode est plus robuste pour les requêtes multipart/form-data
        post_data = request.httprequest.form.to_dict()
        files = request.httprequest.files

        _logger.info(f"Données de formulaire reçues : {post_data}")
        _logger.info(f"Fichiers reçus : {files.getlist('file')}")

        title = post_data.get("name")
        if not title:
            _logger.error(
                "ÉCHEC : Le titre ('name') est manquant dans les données reçues."
            )
            return Response(
                json.dumps({"error": "Le titre du post est obligatoire."}),
                status=400,
                content_type="application/json",
            )

        _logger.info(f"SUCCÈS : Le titre a été trouvé : '{title}'")

        vals = {
            "name": title,
            "body": post_data.get("body"),
            "post_type": "text",  # À rendre dynamique si nécessaire
            "user_id": request.env.user.id,
        }

        # Gestion du fichier
        upload_file = files.get("file")
        if upload_file:
            _logger.info("Fichier détecté, traitement en cours...")
            vals["image"] = base64.b64encode(upload_file.read())

        _logger.info(
            f"Création du post avec les valeurs pour les champs : {list(vals.keys())}"
        )
        record = request.env["intranet.post"].sudo().create(vals)

        _logger.info(f"Post créé avec succès, ID : {record.id}")

        post_data = {
            'id': record.id,
            'title': record.name,
            'body': record.body,
            'author': record.user_id.name,
            'author_id': record.user_id.id,
            'create_date': record.create_date,
            'type': record.post_type,
            'image': f"/web/image/intranet.post/{record.id}/image" if record.image else None,
            'attachments': [
                {
                    'id': att.id,
                    'name': att.name,
                    'url': f"/web/content/{att.id}?download=1",
                }
                for att in record.attachment_ids
            ],
            'like_count': len(record.like_ids),
            'comment_count': len([c for c in record.comment_ids if not c.parent_id]),
        }

        return Response(
            json.dumps({"status": "success", "data": {"id": record.id}}, default=str),
            content_type="application/json",
            headers=CORS_HEADERS,)

    # Garde la version de 'main' pour ajouter des commentaires
    @http.route('/api/intranet/posts/<int:post_id>/comments', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def add_comment(self, post_id, **kw):
        # 1. Lire les données JSON manuellement depuis le corps de la requête
        try:
            data = json.loads(request.httprequest.data)
            content = data.get('content')
            parent_id = data.get('parent_id')
        except Exception as e:
            _logger.error("Impossible de parser le corps JSON : %s", e)
            raise ValidationError("Format de requête invalide.")

        # 2. Valider les données reçues
        if not content:
            raise ValidationError('Le contenu du commentaire est requis')

        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return json_response({'status': 'error', 'message': 'Post not found'}, status=404)

        comment_model = request.env['intranet.post.comment'].sudo()

        # 3. Logique métier : empêcher un utilisateur de commenter plusieurs fois (sauf si c'est une réponse)
        existing = comment_model.search([
            ('post_id', '=', post.id),
            ('user_id', '=', request.env.user.id),
            ('parent_id', '=', False),
        ], limit=1)
        if existing and not parent_id:
            return json_response({'status': 'error', 'message': 'Vous avez déjà commenté ce post.'}, status=400)

        # 4. Créer l'enregistrement du commentaire
        vals = {
            'post_id': post.id,
            'user_id': request.env.user.id,
            'content': content,
        }
        if parent_id:
            vals['parent_id'] = int(parent_id)

        comment = comment_model.create(vals)
        _logger.info("Commentaire créé avec l'ID : %s", comment.id)

        # 5. Recalculer le nombre total de commentaires et le renvoyer
        comment_count = comment_model.search_count([
            ('post_id', '=', post.id),
            ('parent_id', '=', False)
        ])

        return json_response({
            'status': 'success',
            'data': {
                'id': comment.id,
                'comment_count': comment_count
            }
        })

    @http.route('/api/intranet/posts/<int:post_id>/comments', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def get_comments(self, post_id, **kw):
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Post not found'}), status=404, headers=CORS_HEADERS)

        comment_model = request.env['intranet.post.comment'].sudo()
        comments = comment_model.search([('post_id', '=', post.id), ('parent_id', '=', False)], order='create_date asc')

        def serialize(comment):
            return {
                'id': comment.id,
                'user_id': comment.user_id.id,
                'user_name': comment.user_id.name,
                'content': comment.content,
                'parent_id': comment.parent_id.id if comment.parent_id else None,
                'create_date': comment.create_date,
                'children': [serialize(c) for c in comment.child_ids],
            }

        data = [serialize(c) for c in comments]
        return Response(json.dumps({'status': 'success', 'data': data}, default=str), headers=CORS_HEADERS)

    @http.route('/api/intranet/posts/<int:post_id>/likes', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def toggle_like(self, post_id, **kw):
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Post not found'}), status=404, headers=CORS_HEADERS)

        like_model = request.env['intranet.post.like'].sudo()
        existing = like_model.search([('post_id', '=', post.id), ('user_id', '=', request.env.user.id)], limit=1)

        liked = False
        if existing:
            existing.unlink()
        else:
            like_model.create({'post_id': post.id, 'user_id': request.env.user.id})
            liked = True
        return Response(
            json.dumps(
                {
                    "status": "success",
                    "data": {
                        "liked": liked,
                        "like_count": len(post.like_ids),
                    },
                },
                default=str,
            ),
            headers=CORS_HEADERS,
        )

    @http.route('/api/intranet/posts/<int:post_id>/views', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def add_view(self, post_id, **kw):
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Post not found'}), status=404, headers=CORS_HEADERS)

        post.write({'viewer_ids': [(4, request.env.user.id)]})
        return Response(
            json.dumps({'status': 'success', 'data': {'view_count': post.view_count}}, default=str),
            headers=CORS_HEADERS,
        )

    @http.route('/api/intranet/posts/unread_count', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def unread_count(self, **kw):
        count = request.env['intranet.post'].sudo().search_count([
            ('viewer_ids', 'not in', request.env.user.id)
        ])
        return Response(
            json.dumps({'status': 'success', 'data': {'count': count}}, default=str),
            headers=CORS_HEADERS,
        )

    @http.route('/admin/posts', auth='user', type='http', methods=['GET'], csrf=False)
    def admin_posts_page(self, **kw):
        if not request.env.user.has_group('gestion_patrimoine.group_intranet_admin'):
            return Response('Unauthorized', status=403, headers={'Content-Type': 'text/plain'})

        posts = request.env['intranet.post'].sudo().search([], order='create_date desc')
        rows = []
        for p in posts:
            view_url = f"/web#id={p.id}&model=intranet.post&view_type=form"
            delete_url = f"/admin/posts/{p.id}/delete"
            row = f"<tr><td>{p.name}</td><td>{p.user_id.name}</td><td>{p.view_count}</td><td><a href='{view_url}'>Voir</a> | <a href='{delete_url}'>Supprimer</a></td></tr>"
            rows.append(row)
        html = (
            "<html><body><h1>Liste des publications</h1><table border='1'>"
            "<tr><th>Titre</th><th>Auteur</th><th>Vues</th><th>Action</th></tr>"
            + "".join(rows)
            + "</table></body></html>"
        )
        return Response(html, headers={'Content-Type': 'text/html'})

    @http.route('/admin/posts/<int:post_id>/delete', auth='user', type='http', methods=['GET'], csrf=False)
    def admin_post_delete(self, post_id, **kw):
        if not request.env.user.has_group('gestion_patrimoine.group_intranet_admin'):
            return Response('Unauthorized', status=403, headers={'Content-Type': 'text/plain'})
        post = request.env['intranet.post'].sudo().browse(post_id)
        if post.exists():
            post.unlink()
        return request.redirect('/admin/posts')

    @http.route('/api/intranet/comments/<int:comment_id>', auth='user', type='http', methods=['PUT'], csrf=False)
    @handle_api_errors
    def update_comment(self, comment_id, **kw):
        comment = request.env['intranet.post.comment'].sudo().browse(comment_id)
        if not comment.exists():
            return json_response({'status': 'error', 'message': 'Commentaire non trouvé'}, status=404)

        # Sécurité : Seul l'auteur peut modifier son commentaire
        if comment.user_id.id != request.env.user.id:
            return json_response({'status': 'error', 'message': 'Non autorisé'}, status=403)

        # CORRECTION : On lit les données JSON manuellement depuis le corps de la requête HTTP
        try:
            data = json.loads(request.httprequest.data)
        except Exception:
            return json_response({'status': 'error', 'message': 'Format de données invalide'}, status=400)

        if 'content' in data:
            comment.write({'content': data['content']})
            return json_response({
                'status': 'success',
                'data': {
                    'id': comment.id,
                    'content': comment.content
                }
            })

        return json_response({'status': 'error', 'message': 'Contenu manquant'}, status=400)

    @http.route('/api/intranet/comments/<int:comment_id>', auth='user', type='http', methods=['DELETE'], csrf=False)
    @handle_api_errors
    def delete_comment(self, comment_id, **kw):
        comment = request.env['intranet.post.comment'].sudo().browse(comment_id)
        if not comment.exists():
            return json_response({'status': 'error', 'message': 'Commentaire non trouvé'}, status=404)

        # Sécurité : Seul l'auteur ou un admin peut supprimer
        is_author = comment.user_id.id == request.env.user.id
        is_admin = request.env.user.has_group('base.group_system') # ou un groupe plus spécifique

        if not is_author and not is_admin:
            return json_response({'status': 'error', 'message': 'Non autorisé'}, status=403)

        comment.unlink()
        return json_response({'status': 'success', 'message': 'Commentaire supprimé'})

    @http.route('/api/intranet/comments/<int:comment_id>/thread', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def get_comment_thread(self, comment_id, **kw):
        comment_model = request.env['intranet.post.comment'].sudo()
        parent_comment = request.env["intranet.post.comment"].sudo().browse(comment_id)

        if not parent_comment.exists():
            return json_response({'status': 'error', 'message': 'Commentaire non trouvé'}, status=404)

        # Fonction pour sérialiser les commentaires
        def serialize(comment):
            return {
                "id": comment.id,
                "post_id": comment.post_id.id,
                "user_id": comment.user_id.id,
                "user_name": comment.user_id.name,
                "content": comment.content,
                "parent_id": comment.parent_id.id if comment.parent_id else None,
                "create_date": comment.create_date,
                "children": [serialize(c) for c in comment.child_ids],
            }

        # Sérialiser le commentaire parent et ses réponses directes
        parent_data = serialize(parent_comment)
        replies_data = [serialize(reply) for reply in parent_comment.child_ids]

        response_data = {
            'parent': parent_data,
            'replies': replies_data
        }

        return Response(json.dumps({'status': 'success', 'data': response_data}, default=str), headers=CORS_HEADERS)

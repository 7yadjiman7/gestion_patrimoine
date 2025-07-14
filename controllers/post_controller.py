import json
import base64
import logging
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import ValidationError

from .common import handle_api_errors, CORS_HEADERS

_logger = logging.getLogger(__name__)

class IntranetPostController(http.Controller):

    # Garde la version de 'main' qui est plus complète
    @http.route('/api/intranet/posts', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def list_posts(self, **kwargs):
        posts = request.env['intranet.post'].sudo().search([], order='create_date desc')
        result = []
        for post in posts:
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
                'comment_count': len(post.comment_ids),
                'view_count': post.view_count,
            })
        return Response(
            json.dumps({'status': 'success', 'data': result}, default=str),
            headers=CORS_HEADERS,
        )

    @http.route(
        "/api/intranet/posts", auth="user", type="http", methods=["POST"], csrf=False
    )
    @handle_api_errors
    def create_post(self, **kwargs):  # On utilise **kwargs pour être flexible
        _logger.info("--- DÉBUT DE create_post ---")

        # --- CORRECTION FINALE : On lit les données directement depuis la requête http ---
        # Cette méthode est plus robuste pour les requêtes multipart/form-data
        post_data = request.httprequest.form.to_dict()
        files = request.httprequest.files

        _logger.info(f"Données de formulaire reçues : {post_data}")
        _logger.info(f"Fichiers reçus : {files.getlist('image')}")

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

        # Gestion de l'image
        image_file = files.get("image")
        if image_file:
            _logger.info("Image détectée, traitement en cours...")
            vals["image"] = base64.b64encode(image_file.read())

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
            'comment_count': len(record.comment_ids),
        }

        return Response(
            json.dumps({"status": "success", "data": {"id": record.id}}, default=str),
            content_type="application/json",
            headers=CORS_HEADERS,)

    # Garde la version de 'main' pour ajouter des commentaires
    @http.route('/api/intranet/posts/<int:post_id>/comments', auth='user', type='json', methods=['POST'], csrf=False)
    @handle_api_errors
    def add_comment(self, post_id, content=None, parent_id=None, **kw):
        data = request.jsonrequest or {}
        content = content or kw.get('content') or data.get('content')
        parent_id = parent_id or kw.get('parent_id') or data.get('parent_id')

        if not content:
            raise ValidationError('Comment content is required')
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Post not found'}), status=404, headers=CORS_HEADERS)

        vals = {
            'post_id': post.id,
            'user_id': request.env.user.id,
            'content': content,
        }
        if parent_id:
            vals['parent_id'] = parent_id

        comment = request.env['intranet.post.comment'].sudo().create(vals)

        return Response(json.dumps({'status': 'success', 'data': {'id': comment.id}}, default=str), headers=CORS_HEADERS)

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

    @http.route('/admin/posts', auth='user', type='http', methods=['GET'], csrf=False)
    def admin_posts_page(self, **kw):
        if not request.env.user.has_group('gestion_patrimoine.group_patrimoine_admin'):
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
        if not request.env.user.has_group('gestion_patrimoine.group_patrimoine_admin'):
            return Response('Unauthorized', status=403, headers={'Content-Type': 'text/plain'})
        post = request.env['intranet.post'].sudo().browse(post_id)
        if post.exists():
            post.unlink()
        return request.redirect('/admin/posts')

import json
import base64
import logging
from odoo import http
from odoo.http import request, Response

# Assurez-vous que handle_api_errors est bien importé depuis votre autre contrôleur
from .asset_controller import handle_api_errors, CORS_HEADERS

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
                'create_date': post.create_date,
                'type': post.post_type,
                'image': f"/web/image/intranet.post/{post.id}/image" if post.image else None,
                'attachments': [
                    {'id': att.id, 'name': att.name, 'url': f"/web/content/{att.id}?download=1"}
                    for att in post.attachment_ids
                ],
                'like_count': len(post.like_ids),
                'comment_count': len(post.comment_ids),
            })
        return Response(
            json.dumps({'status': 'success', 'data': result}, default=str),
            headers=CORS_HEADERS,
        )

    # Garde la version de 'main' pour la création, qui est plus robuste
    @http.route('/api/intranet/posts', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def create_post(self, **post):
        # On utilise `post` directement au lieu de `request.jsonrequest` car c'est un formulaire multipart/form-data
        vals = {
            'name': post.get('name'),
            'body': post.get('body'),
            'post_type': post.get('type', 'text'),
            'user_id': request.env.user.id,
            'department_id': int(post.get('department_id')) if post.get('department_id') else False,
        }
        
        # Gestion de l'image
        if 'image' in request.httprequest.files:
            vals['image'] = base64.b64encode(request.httprequest.files['image'].read())

        record = request.env['intranet.post'].sudo().create(vals)

        # Gestion des pièces jointes multiples
        attachment_ids = []
        if 'attachments' in request.httprequest.files:
            for file_storage in request.httprequest.files.getlist('attachments'):
                attachment = request.env['ir.attachment'].sudo().create({
                    'name': file_storage.filename,
                    'datas': base64.b64encode(file_storage.read()),
                    'res_model': 'intranet.post',
                    'res_id': record.id,
                })
                attachment_ids.append(attachment.id)
        if attachment_ids:
            record.write({'attachment_ids': [(6, 0, attachment_ids)]})

        return Response(
            json.dumps({'status': 'success', 'data': {'id': record.id}}, default=str),
            headers=CORS_HEADERS,
        )

    # Garde la version de 'main' pour ajouter des commentaires
    @http.route('/api/intranet/posts/<int:post_id>/comments', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def add_comment(self, post_id, **kw):
        data = request.jsonrequest or {}
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(json.dumps({'status': 'error', 'message': 'Post not found'}), status=404, headers=CORS_HEADERS)
        
        comment = request.env['intranet.post.comment'].sudo().create({
            'post_id': post.id,
            'user_id': request.env.user.id,
            'content': data.get('content'),
        })
        
        return Response(json.dumps({'status': 'success', 'data': {'id': comment.id}}, default=str), headers=CORS_HEADERS)

    # Garde la version de 'main' pour gérer les "likes"
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
            
        return Response(json.dumps({'status': 'success', 'data': {'liked': liked, 'like_count': len(post.like_ids)}}), default=str), headers=CORS_HEADERS)

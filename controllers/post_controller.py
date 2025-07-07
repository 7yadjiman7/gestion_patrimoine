from odoo import http
from odoo.http import request, Response
import json
import base64

from .asset_controller import CORS_HEADERS, handle_api_errors


class PostController(http.Controller):
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
                'attachments': [
                    {'id': att.id, 'name': att.name}
                    for att in post.attachment_ids
                ],
                'like_count': len(post.like_ids),
                'comment_count': len(post.comment_ids),
            })
        return Response(
            json.dumps({'status': 'success', 'data': result}, default=str),
            headers=CORS_HEADERS,
        )

    @http.route('/api/intranet/posts', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def create_post(self, **post):
        data = request.jsonrequest or {}
        vals = {
            'name': data.get('title', 'Post'),
            'body': data.get('description'),
            'post_type': data.get('type', 'text'),
            'user_id': request.env.user.id,
        }
        record = request.env['intranet.post'].sudo().create(vals)

        attachment_ids = []
        for file_storage in request.httprequest.files.values():
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

    @http.route('/api/intranet/posts/<int:post_id>/comments', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def add_comment(self, post_id, **kw):
        data = request.jsonrequest or {}
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(
                json.dumps({'status': 'error', 'code': 404, 'message': 'Post not found'}),
                status=404,
                headers=CORS_HEADERS,
            )
        comment = request.env['intranet.post.comment'].sudo().create({
            'post_id': post.id,
            'user_id': request.env.user.id,
            'content': data.get('content'),
        })
        return Response(
            json.dumps({
                'status': 'success',
                'data': {
                    'id': comment.id,
                    'content': comment.content,
                    'author': comment.user_id.name,
                    'date': comment.create_date,
                },
            }, default=str),
            headers=CORS_HEADERS,
        )

    @http.route('/api/intranet/posts/<int:post_id>/likes', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def toggle_like(self, post_id, **kw):
        post = request.env['intranet.post'].sudo().browse(post_id)
        if not post.exists():
            return Response(
                json.dumps({'status': 'error', 'code': 404, 'message': 'Post not found'}),
                status=404,
                headers=CORS_HEADERS,
            )

        like_model = request.env['intranet.post.like'].sudo()
        existing = like_model.search([
            ('post_id', '=', post.id),
            ('user_id', '=', request.env.user.id)
        ], limit=1)
        liked = False
        if existing:
            existing.unlink()
        else:
            like_model.create({'post_id': post.id, 'user_id': request.env.user.id})
            liked = True
        return Response(
            json.dumps({'status': 'success', 'data': {'liked': liked}}, default=str),
            headers=CORS_HEADERS,
        )

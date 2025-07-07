from odoo import http
from odoo.http import request, Response
import base64
import json
import logging

from .asset_controller import handle_api_errors, CORS_HEADERS

_logger = logging.getLogger(__name__)

class IntranetPostController(http.Controller):
    @http.route('/api/intranet/posts', auth='user', type='http', methods=['POST'], csrf=False)
    @handle_api_errors
    def create_post(self, **post):
        attachments = []
        if 'attachments' in request.httprequest.files:
            files = request.httprequest.files.getlist('attachments')
            for file in files:
                att = request.env['ir.attachment'].sudo().create({
                    'name': file.filename,
                    'datas': base64.b64encode(file.read()),
                    'mimetype': file.content_type,
                    'res_model': 'intranet.post',
                })
                attachments.append(att.id)

        image_data = None
        if 'image' in request.httprequest.files:
            image_file = request.httprequest.files['image']
            image_data = base64.b64encode(image_file.read())

        values = {
            'name': post.get('name'),
            'body': post.get('body'),
            'department_id': int(post.get('department_id')) if post.get('department_id') else False,
        }
        if image_data:
            values['image'] = image_data
        if attachments:
            values['attachment_ids'] = [(6, 0, attachments)]

        new_post = request.env['intranet.post'].sudo().create(values)
        return Response(json.dumps({'status': 'success', 'id': new_post.id}), headers=CORS_HEADERS)

    @http.route('/api/intranet/posts', auth='user', type='http', methods=['GET'], csrf=False)
    @handle_api_errors
    def list_posts(self, **kw):
        posts = request.env['intranet.post'].sudo().search([], order='create_date desc')
        data = []
        for post in posts:
            data.append({
                'id': post.id,
                'name': post.name,
                'body': post.body,
                'image': f"/web/image/intranet.post/{post.id}/image" if post.image else None,
                'attachments': [
                    {
                        'id': att.id,
                        'name': att.name,
                        'url': f"/web/content/{att.id}?download=1",
                    }
                    for att in post.attachment_ids
                ],
            })
        return Response(json.dumps({'status': 'success', 'data': data}), headers=CORS_HEADERS)


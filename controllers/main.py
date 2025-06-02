from odoo import http
from odoo.http import request, Response
import json

class PatrimoineController(http.Controller):
    
    @http.route('/api/web/session/authenticate', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False, cors='*')
    def authenticate(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            }
            return Response(status=200, headers=headers)
        
        try:
            data = json.loads(request.httprequest.data)
            request.session.authenticate(data.get('db'), data.get('login'), data.get('password'))
            result = request.env['ir.http'].session_info()
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
            return Response(json.dumps(result), headers=headers)
        except Exception as e:
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
            return Response(json.dumps({'error': str(e)}), status=400, headers=headers)

from odoo import http
from odoo.http import request, Response
import json
import logging
from werkzeug.exceptions import BadRequest

_logger = logging.getLogger(__name__)

class PatrimoineAssetController(http.Controller):
    @http.route('/api/patrimoine/assets', auth='user', type='http', methods=['GET'])
    def list_assets(self, **kw):
        assets = request.env['patrimoine.asset'].search([])
        asset_data = [{
            'id': asset.id,
            'name': asset.name,
            'type': asset.type,
            'location': asset.location_id.name,
            'category': asset.categorie_id.name,
            'acquisitionDate': asset.date_acquisition,
            'value': asset.valeur_acquisition,
            'status': asset.etat,
            'assignedTo': asset.employee_id.name if asset.employee_id else None
        } for asset in assets]
        return Response(json.dumps(asset_data), headers={'Content-Type': 'application/json'})

    @http.route('/api/patrimoine/assets/<int:asset_id>', auth='user', type='http', methods=['GET'])
    def get_asset(self, asset_id, **kw):
        asset = request.env['patrimoine.asset'].browse(asset_id)
        if not asset.exists():
            return Response(status=404)
        
        asset_data = {
            'id': asset.id,
            'name': asset.name,
            'type': asset.type,
            'location': asset.location_id.name,
            'category': asset.categorie_id.name,
            'acquisitionDate': asset.date_acquisition,
            'value': asset.valeur_acquisition,
            'status': asset.etat,
            'assignedTo': asset.employee_id.name if asset.employee_id else None
        }
        return Response(json.dumps(asset_data), headers={'Content-Type': 'application/json'})

    @http.route('/api/patrimoine/assets', auth='user', type='json', methods=['POST'], csrf=False)
    def create_asset(self, **post):
        try:
            asset = request.env['patrimoine.asset'].create({
                'name': post.get('name'),
                'type': post.get('type'),
                'location_id': post.get('location_id'),
                'categorie_id': post.get('category_id'),
                'date_acquisition': post.get('acquisitionDate'),
                'valeur_acquisition': post.get('value'),
                'employee_id': post.get('assignedTo')
            })
            return {'status': 'success', 'asset_id': asset.id}
        except Exception as e:
            _logger.error("Error creating asset: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    @http.route('/api/patrimoine/assets/<int:asset_id>', auth='user', type='json', methods=['PUT'], csrf=False)
    def update_asset(self, asset_id, **post):
        asset = request.env['patrimoine.asset'].browse(asset_id)
        if not asset.exists():
            return {'status': 'error', 'message': 'Asset not found'}, 404
        
        try:
            asset.write({
                'name': post.get('name'),
                'type': post.get('type'),
                'location_id': post.get('location_id'),
                'categorie_id': post.get('category_id'),
                'date_acquisition': post.get('acquisitionDate'),
                'valeur_acquisition': post.get('value'),
                'employee_id': post.get('assignedTo')
            })
            return {'status': 'success'}
        except Exception as e:
            _logger.error("Error updating asset: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    @http.route('/api/patrimoine/assets/<int:asset_id>', auth='user', type='json', methods=['DELETE'], csrf=False)
    def delete_asset(self, asset_id, **kw):
        asset = request.env['patrimoine.asset'].browse(asset_id)
        if not asset.exists():
            return {'status': 'error', 'message': 'Asset not found'}, 404
        
        try:
            asset.unlink()
            return {'status': 'success'}
        except Exception as e:
            _logger.error("Error deleting asset: %s", str(e))
            return {'status': 'error', 'message': str(e)}

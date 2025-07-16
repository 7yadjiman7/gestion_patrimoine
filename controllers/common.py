import json
import os
import logging
from functools import wraps
from odoo.exceptions import AccessError, ValidationError
from odoo.http import Response, request

def get_cors_headers():
    """Compute CORS headers based on the allowed origins."""
    allowed = os.getenv("ALLOWED_ORIGIN", "")
    allowed_origins = [o.strip() for o in allowed.split(',') if o.strip()]
    request_origin = request.httprequest.environ.get("HTTP_ORIGIN") if request else None

    origin = None
    if request_origin and request_origin in allowed_origins:
        origin = request_origin
    elif allowed_origins:
        origin = allowed_origins[0]

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin or "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token, X-Openerp-Session-Id",
        "Access-Control-Allow-Credentials": "true",
    }
    return headers

# Deprecated: kept for backward compatibility
CORS_HEADERS = {}


def json_response(data, status=200):
    """Return a JSON Response with CORS headers."""
    return Response(json.dumps(data, default=str), status=status, headers=get_cors_headers())


def handle_api_errors(func):
    """Decorator to standardize API error handling."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        try:
            return func(*args, **kwargs)
        except AccessError as e:
            logger.error("AccessError in API: %s", str(e))
            return Response(
                json.dumps({"status": "error", "code": 403, "message": str(e)}),
                status=403,
                headers=get_cors_headers(),
            )
        except ValidationError as e:
            logger.error("ValidationError in API: %s", str(e))
            return Response(
                json.dumps({"status": "error", "code": 400, "message": str(e)}),
                status=400,
                headers=get_cors_headers(),
            )
        except Exception as e:
            logger.error("Unexpected error in API: %s", str(e))
            return Response(
                json.dumps({"status": "error", "code": 500, "message": "Internal server error"}),
                status=500,
                headers=get_cors_headers(),
            )

    return wrapper

import json
import logging
from functools import wraps
from odoo.exceptions import AccessError, ValidationError
from odoo.http import Response

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token, X-Openerp-Session-Id",
    "Access-Control-Allow-Credentials": "true",
}


def json_response(data, status=200):
    """Return a JSON Response with CORS headers."""
    return Response(json.dumps(data, default=str), status=status, headers=CORS_HEADERS)


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
                headers=CORS_HEADERS,
            )
        except ValidationError as e:
            logger.error("ValidationError in API: %s", str(e))
            return Response(
                json.dumps({"status": "error", "code": 400, "message": str(e)}),
                status=400,
                headers=CORS_HEADERS,
            )
        except Exception as e:
            logger.error("Unexpected error in API: %s", str(e))
            return Response(
                json.dumps({"status": "error", "code": 500, "message": "Internal server error"}),
                status=500,
                headers=CORS_HEADERS,
            )

    return wrapper

import json
import logging
import os
from functools import wraps
from odoo.exceptions import AccessError, ValidationError
from odoo.http import Response as OdooResponse
from odoo import http

# Allow overriding the CORS origin via an environment variable so deployments
# can specify their frontend URL.  Using a specific origin is required when the
# client sends credentials (cookies or auth headers).
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:5174")

CORS_HEADERS = {
    "Content-Type": "application/json",
}


def Response(*args, **kwargs):
    """Return an Odoo HTTP Response with default CORS headers."""
    headers = kwargs.pop("headers", {})
    headers = {**CORS_HEADERS, **headers}
    return OdooResponse(*args, headers=headers, **kwargs)


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


class CORSController(http.Controller):
    """Generic controller to respond to CORS preflight requests."""

    @http.route('/<path:any>', type='http', auth='none', methods=['OPTIONS'], csrf=False)
    def options(self, **_):
        """Return an empty response with CORS headers for preflight."""
        return Response(status=200)


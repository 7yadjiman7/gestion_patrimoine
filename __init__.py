try:
    from . import models
    from . import controllers
    from .hooks import pre_init_hook, post_init_hook
except Exception:
    # Allow importing the package without Odoo environment, e.g. for tests
    models = None
    controllers = None
    pre_init_hook = None
    post_init_hook = None

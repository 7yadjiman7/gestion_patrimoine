"""Expose all model modules when the package is imported.

The unit tests insert stub implementations of the ``odoo`` package in
``sys.modules`` before importing this package so the imports below work
even outside an actual Odoo environment.
"""

from . import asset
from . import asset_informatique
from . import asset_mobilier
from . import asset_vehicule
from . import entretien
from . import mouvement
from . import fiche_vie
from . import demande_materiel
from . import demande_materiel_ligne
from . import pertes
from . import chat
from . import post
from . import chat_test

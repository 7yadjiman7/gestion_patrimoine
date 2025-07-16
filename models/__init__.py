import sys

if 'pytest' not in sys.modules:
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

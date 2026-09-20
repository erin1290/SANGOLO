from django.core.management.base import BaseCommand, CommandError

from alertes.apprentissage import entrainer, sauvegarder_modele
from alertes.models import Alerte, SourceAlerte, VerdictIA


class Command(BaseCommand):
    help = "Entraîne le classifieur local depuis les alertes qualifiées par des superviseurs."

    def handle(self, *args, **options):
        alertes = Alerte.objects.filter(
            source=SourceAlerte.MODULE_IA,
            message__isnull=False,
            verdict_ia__in=[VerdictIA.CONFIRMEE, VerdictIA.FAUX_POSITIF],
        ).select_related("message")
        exemples = []
        for alerte in alertes:
            classe = "aucun" if alerte.verdict_ia == VerdictIA.FAUX_POSITIF else alerte.gravite
            exemples.append((alerte.message.contenu, classe))
        try:
            modele = entrainer(exemples)
        except ValueError as erreur:
            raise CommandError(str(erreur))
        chemin = sauvegarder_modele(modele)
        self.stdout.write(self.style.SUCCESS(
            f"Modèle local entraîné avec {modele['nombre_exemples']} exemples : {chemin}"
        ))

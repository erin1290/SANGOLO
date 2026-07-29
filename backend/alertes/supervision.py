"""
alertes/supervision.py

Le module de surveillance IA. Point de conception essentiel, rappelé
à chaque étape du cahier des charges : ce module N'EST JAMAIS un
interlocuteur. Il ne répond jamais à l'ado ni à l'écoutant. Il observe
en silence les messages échangés et, s'il détecte un signal, crée une
Alerte destinée à un superviseur humain — qui décide seul de la suite.

Version actuelle : détection par mots-clés (étape 1 du cahier des
charges). Conçu pour être remplacé plus tard par une analyse NLP plus
fine sans changer l'interface (analyser_message_en_tache_de_fond reste
le seul point d'entrée utilisé par consumers.py).
"""
from .models import Alerte, SourceAlerte, GraviteAlerte

# Ces listes sont volontairement simples pour la V1. Elles devront être
# affinées avec un professionnel de santé mentale avant mise en production —
# un mot-clé mal calibré peut autant manquer un vrai danger que noyer les
# superviseurs sous les faux positifs.
MOTS_CLES_DANGER_UTILISATEUR = {
    "urgent": [
        "envie de mourir", "en finir", "me faire du mal", "personne ne me manquerait",
    ],
    "moyen": [
        "je n'en peux plus", "je vois plus de sens", "je suis un poids",
    ],
}

MOTS_CLES_CONSEIL_PROBLEMATIQUE = {
    "moyen": [
        "arrête de pleurer", "c'est pas grave", "tu exagères", "il faut juste positiver",
    ],
}


def _contient_un_des_mots(texte, liste_mots):
    texte_normalise = texte.lower()
    return any(mot in texte_normalise for mot in liste_mots)


def _detecter_gravite(texte, dictionnaire_mots_cles):
    for gravite in (GraviteAlerte.URGENT, GraviteAlerte.MOYEN, GraviteAlerte.FAIBLE):
        mots = dictionnaire_mots_cles.get(gravite, [])
        if mots and _contient_un_des_mots(texte, mots):
            return gravite
    return None


def analyser_message_en_tache_de_fond(message):
    """
    Point d'entrée unique appelé après l'enregistrement de chaque message
    (cf. messagerie/consumers.py). Ne bloque jamais l'envoi du message —
    l'échange humain continue normalement pendant l'analyse.
    """
    from .models import Alerte  # import différé pour éviter les imports circulaires

    if message.auteur == "utilisateur":
        gravite = _detecter_gravite(message.contenu, MOTS_CLES_DANGER_UTILISATEUR)
        if gravite:
            _creer_alerte_module_ia(
                message, gravite,
                "Signal de détresse détecté dans un message de l'ado."
            )
            message.signale_par_module_ia = True
            message.save(update_fields=["signale_par_module_ia"])

    elif message.auteur == "ecoutant":
        gravite = _detecter_gravite(message.contenu, MOTS_CLES_CONSEIL_PROBLEMATIQUE)
        if gravite:
            _creer_alerte_module_ia(
                message, gravite,
                "Formulation potentiellement inappropriée détectée côté écoutant."
            )
            message.signale_par_module_ia = True
            message.save(update_fields=["signale_par_module_ia"])


def _creer_alerte_module_ia(message, gravite, description):
    Alerte.objects.create(
        conversation=message.conversation,
        source=SourceAlerte.MODULE_IA,
        gravite=gravite,
        description=description,
    )

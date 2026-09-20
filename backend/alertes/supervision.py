"""
alertes/supervision.py

Le module de surveillance IA. Point de conception essentiel, rappelé
à chaque étape du cahier des charges : ce module N'EST JAMAIS un
interlocuteur. Il ne répond jamais à l'ado ni à l'écoutant. Il observe
en silence les messages échangés et, s'il détecte un signal, crée une
Alerte destinée à un superviseur humain — qui décide seul de la suite.

Le filtre de mots-clés assure la sécurité de départ. Il est complété, quand
des superviseurs ont validé suffisamment d'exemples, par un classifieur local
entraîné sans API externe.
"""
import logging
from threading import Thread

from django.db import close_old_connections, transaction

from .models import Alerte, SourceAlerte, GraviteAlerte

logger = logging.getLogger(__name__)

# Ces listes sont volontairement simples pour la V1. Elles devront être
# affinées avec un professionnel de santé mentale avant mise en production —
# un mot-clé mal calibré peut autant manquer un vrai danger que noyer les
# superviseurs sous les faux positifs.
MOTS_CLES_DANGER_UTILISATEUR = {
    "urgent": [
        "envie de mourir", "je veux me suicider", "veux me suicider", "me suicider",
        "en finir", "me faire du mal", "personne ne me manquerait",
    ],
    "moyen": [
        "je n'en peux plus", "je vois plus de sens", "je suis un poids",
    ],
}

MOTS_CLES_CONSEIL_PROBLEMATIQUE = {
    "urgent": [
        "tu devrais te suicider", "va te suicider", "suicide-toi", "suicide toi", "tue-toi", "tue toi",
        "tu ferais mieux de mourir", "tu devrais mourir", "passe à l'acte",
        "fais-toi du mal", "fais toi du mal",
    ],
    "moyen": [
        "arrête de pleurer", "c'est pas grave", "tu exagères", "il faut juste positiver",
        "personne ne t'aidera", "personne ne va t'aider", "tu es un poids",
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


def planifier_analyse_message(message_id):
    """Lance l'analyse après la transaction, sans ralentir le chat."""
    def lancer():
        Thread(target=analyser_message_en_tache_de_fond, args=(message_id,), daemon=True,
               name=f"analyse-ia-message-{message_id}").start()

    transaction.on_commit(lancer)


def analyser_message_en_tache_de_fond(message_id):
    """Analyse synchrone exécutée dans le thread lancé par le planificateur."""
    from messagerie.models import Message

    close_old_connections()
    try:
        message = Message.objects.select_related("conversation__utilisateur").get(id=message_id)
        if not message.conversation.utilisateur.consentement_analyse_ia:
            Message.objects.filter(id=message.id, analyse_ia_effectuee=False).update(analyse_ia_effectuee=True)
            return

        # Une seule analyse, donc au plus une alerte, pour un message donné.
        if not Message.objects.filter(id=message.id, analyse_ia_effectuee=False).update(analyse_ia_effectuee=True):
            return
        evaluation = _evaluer_message(message)
        if evaluation["signal"]:
            _creer_alerte_module_ia(message, evaluation["gravite"], evaluation["motif"])
            Message.objects.filter(id=message.id).update(signale_par_module_ia=True)
    except Exception:
        # Une défaillance du classifieur ne doit jamais interrompre l'échange humain.
        logger.exception("Échec de l'analyse de sécurité du message %s", message_id)
    finally:
        close_old_connections()


def _evaluer_message(message):
    # Les règles explicites restent prioritaires, même après entraînement.
    evaluation_regles = _evaluer_avec_mots_cles(message)
    if evaluation_regles["signal"]:
        return evaluation_regles

    from .apprentissage import predire_signal_local
    try:
        return predire_signal_local(message.contenu)
    except Exception:
        # Le modèle local est une aide facultative : une erreur ne bloque jamais le chat.
        logger.exception("Échec du classifieur local ; recours aux règles.")
        return {"signal": False, "gravite": "aucun", "motif": ""}


def _evaluer_avec_mots_cles(message):
    if message.auteur == "utilisateur":
        dictionnaire = MOTS_CLES_DANGER_UTILISATEUR
        motif = "Signal de détresse détecté dans un message de l'ado."
    elif message.auteur == "ecoutant":
        dictionnaire = MOTS_CLES_CONSEIL_PROBLEMATIQUE
        motif = "Formulation potentiellement dangereuse détectée côté écoutant."
    else:
        return {"signal": False, "gravite": "aucun", "motif": ""}
    gravite = _detecter_gravite(message.contenu, dictionnaire)
    if not gravite:
        return {"signal": False, "gravite": "aucun", "motif": ""}
    return {"signal": True, "gravite": gravite, "motif": motif}


def _creer_alerte_module_ia(message, gravite, description):
    Alerte.objects.create(
        conversation=message.conversation,
        message=message,
        source=SourceAlerte.MODULE_IA,
        gravite=gravite,
        description=description,
    )

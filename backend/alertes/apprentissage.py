"""Classifieur local supervisé, sans dépendance ni service externe.

Le fichier de modèle ne contient que des comptes de tokens agrégés, jamais les
messages eux-mêmes. Il est entraîné exclusivement sur les verdicts humains.
"""
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

from django.conf import settings

CLASSES = ("aucun", "faible", "moyen", "urgent")
MIN_EXEMPLES = 12
TOKEN_RE = re.compile(r"[a-zàâçéèêëîïôûùüÿñæœ]{2,}", re.IGNORECASE)


def _chemin_modele():
    return Path(getattr(settings, "SUPERVISION_LOCAL_MODEL_PATH", settings.BASE_DIR / "data" / "supervision_local.json"))


def tokeniser(texte):
    return TOKEN_RE.findall(texte.lower())


def entrainer(exemples):
    """Construit un Naive Bayes multinomial à partir de paires (texte, classe)."""
    comptes_classes = Counter()
    comptes_tokens = defaultdict(Counter)
    total_tokens = Counter()
    vocabulaire = set()
    for texte, classe in exemples:
        if classe not in CLASSES:
            continue
        tokens = tokeniser(texte)
        if not tokens:
            continue
        comptes_classes[classe] += 1
        comptes_tokens[classe].update(tokens)
        total_tokens[classe] += len(tokens)
        vocabulaire.update(tokens)
    total = sum(comptes_classes.values())
    if total < MIN_EXEMPLES or len(comptes_classes) < 2:
        raise ValueError(f"Il faut au moins {MIN_EXEMPLES} exemples, répartis sur deux classes.")
    return {
        "version": 1,
        "nombre_exemples": total,
        "classes": dict(comptes_classes),
        "tokens": {classe: dict(compte) for classe, compte in comptes_tokens.items()},
        "totaux": dict(total_tokens),
        "vocabulaire": len(vocabulaire),
    }


def sauvegarder_modele(modele):
    chemin = _chemin_modele()
    chemin.parent.mkdir(parents=True, exist_ok=True)
    chemin.write_text(json.dumps(modele, ensure_ascii=False), encoding="utf-8")
    return chemin


def predire_signal_local(texte):
    chemin = _chemin_modele()
    if not chemin.exists():
        return {"signal": False, "gravite": "aucun", "motif": ""}
    modele = json.loads(chemin.read_text(encoding="utf-8"))
    total = modele.get("nombre_exemples", 0)
    classes = modele.get("classes", {})
    if total < MIN_EXEMPLES or len(classes) < 2:
        return {"signal": False, "gravite": "aucun", "motif": ""}
    vocabulaire = max(modele.get("vocabulaire", 0), 1)
    tokens = tokeniser(texte)
    scores = {}
    for classe, nombre in classes.items():
        score = math.log((nombre + 1) / (total + len(classes)))
        comptes = modele.get("tokens", {}).get(classe, {})
        denominateur = modele.get("totaux", {}).get(classe, 0) + vocabulaire
        for token in tokens:
            score += math.log((comptes.get(token, 0) + 1) / denominateur)
        scores[classe] = score
    classe, score = max(scores.items(), key=lambda item: item[1])
    normalisateur = sum(math.exp(valeur - score) for valeur in scores.values())
    confiance = 1 / normalisateur
    if classe == "aucun" or confiance < 0.70:
        return {"signal": False, "gravite": "aucun", "motif": ""}
    return {
        "signal": True,
        "gravite": classe,
        "motif": f"Signal détecté par le modèle local (confiance {confiance:.0%}).",
    }

# Supervision IA de Sangolo

Le module de supervision utilise un classifieur local gratuit entraîné à partir
des verdicts de superviseurs. Il ne génère jamais de message et ne prend aucune
décision : son seul effet possible est la création d'une `Alerte` attribuable à
un superviseur humain.

## Activation

Appliquer la migration :

```bash
python manage.py migrate
```

Au départ, le filtre local par mots-clés est actif. Chaque superviseur peut
qualifier une alerte IA comme « signal confirmé » ou « faux positif » dans la
fiche d'alerte. Après au moins 12 exemples répartis entre deux catégories,
entraîner le modèle sans coût ni connexion externe :

```bash
python manage.py entrainer_supervision_ia
```

Le fichier produit est `backend/data/supervision_local.json`. Il contient des
statistiques de mots agrégées, pas les messages source.

## Flux de sécurité

`Message créé` → consentement vérifié → analyse en tâche de fond → au plus une
alerte → décision et contact par un superviseur humain.

Le texte source n'est pas recopié dans l'alerte : seul un motif court est
enregistré. Les règles explicites restent prioritaires après entraînement.

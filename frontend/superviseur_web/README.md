# Sangolo — supervision web

Cette interface remplace l'espace superviseur du mobile. Elle utilise les API Django existantes : aucune donnée ni logique d'IA n'est dupliquée.

## Lancer en local

1. Démarrer le backend Django sur le réseau local :

   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 0.0.0.0:8000
   ```

2. Dans un second terminal, servir le frontend web :

   ```bash
   cd frontend/superviseur_web
   python3 -m http.server 3000 --bind 0.0.0.0
   ```

3. Ouvrir `http://localhost:3000` sur le PC, ou `http://IP_DU_PC:3000` depuis un autre poste du même réseau.

L'interface déduit l'API à partir de l'adresse ouverte (`http://IP_DU_PC:8000/api`). Pour un déploiement différent, définir `window.SANGOLO_API_BASE` avant de charger `app.js`.

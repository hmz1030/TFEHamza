# TFEHamza

Projet de fin d'etudes.

## Synchronisations avec Celery et Redis

Les synchronisations automatiques sont distribuees entre trois services :

- Redis transporte les taches et fournit les verrous anti-chevauchement.
- Celery Beat planifie les synchronisations.
- Celery Worker execute les commandes Django existantes.

La planification utilise le fuseau UTC configure dans Django :

- Calendrier des 21 prochains jours chaque jour a 03:00.
- Effectifs des equipes des 21 prochains jours chaque jour a 04:00.
- Calendrier proche toutes les 3 heures entre 08:00 et 23:00.
- Effectifs proches a 08:30, 14:30 et 20:30.
- Scores en direct toutes les minutes.
- Compositions toutes les 10 minutes.
- Points des pronostics toutes les 15 minutes.

### Developpement local

Configurer Django :

```env
# backend/.env
APP_MODE=development
ENABLE_SYNC_ENDPOINTS=true
CELERY_BROKER_URL=redis://127.0.0.1:6379/0

# frontend/.env
VITE_ENABLE_DEV_TOOLS=true
```

Demarrer Redis :

```bash
docker run --name matchnote-redis -p 6379:6379 -d redis:7.4-alpine
```

Dans deux terminaux ouverts dans `backend`, demarrer le Worker puis Beat :

```bash
# Windows
venv\Scripts\celery.exe -A matchnote worker --loglevel=INFO --pool=solo
venv\Scripts\celery.exe -A matchnote beat --loglevel=INFO

# Linux/macOS
celery -A matchnote worker --loglevel=INFO
celery -A matchnote beat --loglevel=INFO
```

Les endpoints de synchronisation manuelle restent controles par `ENABLE_SYNC_ENDPOINTS`.

### Production Docker

Copier `docker/.env.production.example` vers `docker/.env.production`, remplir les secrets, puis lancer :

```bash
docker compose --env-file docker/.env.production -f docker/docker-compose.yml -p matchnote up -d --build
```

Le deploiement demarre le backend, PostgreSQL, Redis, un Celery Worker et une seule instance de Celery Beat. Ne pas lancer plusieurs instances de Beat pour le meme environnement.

Pour remplir les pages club des equipes deja presentes en base avec les matchs passes et a venir connus par l'API, lancer une fois : `python manage.py sync_team_matches` (ou en prod Docker : `docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p matchnote exec backend python manage.py sync_team_matches`).

Pour fusionner les doublons de matchs crees par deux endpoints API differents, lancer : `python manage.py dedupe_matches` (ou en prod Docker : `docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p matchnote exec backend python manage.py dedupe_matches`).

Pour recuperer plus rapidement la lineup d'un match precis en prod, lancer : `docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p matchnote exec backend python manage.py sync_lineups --match-id 52`.

Pour generer 50 comptes de presentation sans prefixe `demo_`, avec commentaires, notes, votes MVP et pronostics, lancer : `python manage.py seed_demo_data --reset` (ou en prod Docker : `docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p matchnote exec backend python manage.py seed_demo_data --reset`).

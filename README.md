# TFEHamza

Projet de fin d'etudes.

## Modes de sync locaux
 car je voulais tester le comportement en prod sans bouton sync dev pour voir comment ca donne en prod
 les matchs a venir sont sync pour les 21 prochains jours 
 pour les matchs du jour, tous les3h ya un update
 et les matchs en direct toutes les 1 minutes ! 
Mode developpement classique :

```env
# backend/.env
APP_MODE=development
ENABLE_SYNC_ENDPOINTS=true
ENABLE_SYNC_SCHEDULER=false

# frontend/.env
VITE_ENABLE_DEV_TOOLS=true
```

Mode prod-test local :

```env
# backend/.env
APP_MODE=development
ENABLE_SYNC_ENDPOINTS=false
ENABLE_SYNC_SCHEDULER=true

# frontend/.env
VITE_ENABLE_DEV_TOOLS=false
```

Lancer le scheduler local :

```bash
backend\venv\Scripts\python.exe backend\manage.py run_sync_scheduler
```

Le scheduler lance :

- `sync_matches --days-ahead=21` une fois par jour apres 03:00.
- `sync_matches --days-ahead=1` toutes les 3h entre 08:00 et 23:00.
- `sync_live_scores` toutes les 1 min.
- `sync_lineups` toutes les 10 min.
- `calculate_pronostic_points` toutes les 15 min.

Pour arreter le scheduler au cas ou si le process tourne encore en arriere plan : `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'manage\.py run_sync_scheduler' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`.

Pour remplir les pages club des equipes deja presentes en base avec les matchs passes et a venir connus par l'API, lancer une fois : `python manage.py sync_team_matches` (ou en prod Docker : `docker compose --env-file .env.production -p matchnote exec backend python manage.py sync_team_matches`).

Pour fusionner les doublons de matchs crees par deux endpoints API differents, lancer : `python manage.py dedupe_matches` (ou en prod Docker : `docker compose --env-file .env.production -p matchnote exec backend python manage.py dedupe_matches`).

Pour recuperer plus rapidement la lineup d'un match precis en prod, lancer : `docker compose --env-file .env.production -p matchnote exec backend python manage.py sync_lineups --match-id 52`.

Pour generer 50 comptes de presentation sans prefixe `demo_`, avec commentaires, notes, votes MVP et pronostics, lancer : `python manage.py seed_demo_data --reset` (ou en prod Docker : `docker compose --env-file .env.production -p matchnote exec backend python manage.py seed_demo_data --reset`).

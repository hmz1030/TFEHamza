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

Pour arreter le scheduler : `Ctrl+C`.

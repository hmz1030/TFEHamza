import os
from datetime import timedelta

from celery import Celery
from celery.schedules import crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'matchnote.settings')

app = Celery('matchnote')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'sync-calendar-21-days-daily': {
        'task': 'matches.sync_calendar_long',
        'schedule': crontab(minute=0, hour=3),
        'options': {'expires': 60 * 60},
    },
    'sync-squads-21-days-daily': {
        'task': 'matches.sync_squads_long',
        'schedule': crontab(minute=0, hour=4),
        'options': {'expires': 60 * 60},
    },
    'sync-calendar-nearby': {
        'task': 'matches.sync_calendar_nearby',
        'schedule': crontab(minute=0, hour='8-23/3'),
        'options': {'expires': 60 * 60},
    },
    'sync-squads-nearby': {
        'task': 'matches.sync_squads_nearby',
        'schedule': crontab(minute=30, hour='8-20/6'),
        'options': {'expires': 60 * 60},
    },
    'sync-live-scores': {
        'task': 'matches.sync_live_scores',
        'schedule': timedelta(minutes=1),
        'options': {'expires': 55},
    },
    'sync-lineups': {
        'task': 'matches.sync_lineups',
        'schedule': timedelta(minutes=10),
        'options': {'expires': 9 * 60},
    },
    'calculate-pronostic-points': {
        'task': 'matches.calculate_pronostic_points',
        'schedule': timedelta(minutes=15),
        'options': {'expires': 14 * 60},
    },
}

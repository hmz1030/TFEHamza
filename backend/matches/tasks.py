import logging

from celery import shared_task
from django.conf import settings
from django.core.management import call_command
from redis import Redis
from redis.exceptions import LockError


logger = logging.getLogger(__name__)
API_SYNC_LOCK_TIMEOUT = 3700


def _run_command_with_lock(command, *, lock_timeout, **options):
    redis_client = Redis.from_url(settings.CELERY_BROKER_URL)
    lock = redis_client.lock(
        f'matchnote:sync-lock:{command}',
        timeout=lock_timeout,
    )

    if not lock.acquire(blocking=False):
        logger.warning('Task skipped because %s is already running.', command)
        return {'status': 'skipped', 'command': command}

    try:
        logger.info('Starting %s with options %s.', command, options)
        call_command(command, **options)
    finally:
        try:
            lock.release()
        except LockError:
            logger.warning('Redis lock expired before %s completed.', command)

    return {'status': 'completed', 'command': command}


@shared_task(name='matches.sync_calendar_long')
def sync_calendar_long():
    return _run_command_with_lock(
        'sync_matches',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
        days_ahead=21,
    )


@shared_task(name='matches.sync_calendar_nearby')
def sync_calendar_nearby():
    return _run_command_with_lock(
        'sync_matches',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
        days_ahead=1,
    )


@shared_task(name='matches.sync_squads_long')
def sync_squads_long():
    return _run_command_with_lock(
        'sync_squads',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
        upcoming_days=21,
    )


@shared_task(name='matches.sync_squads_nearby')
def sync_squads_nearby():
    return _run_command_with_lock(
        'sync_squads',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
        upcoming_days=2,
    )


@shared_task(name='matches.sync_live_scores')
def sync_live_scores():
    return _run_command_with_lock(
        'sync_live_scores',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
    )


@shared_task(name='matches.sync_lineups')
def sync_lineups():
    return _run_command_with_lock(
        'sync_lineups',
        lock_timeout=API_SYNC_LOCK_TIMEOUT,
    )


@shared_task(name='matches.calculate_pronostic_points')
def calculate_pronostic_points():
    return _run_command_with_lock('calculate_pronostic_points', lock_timeout=600)

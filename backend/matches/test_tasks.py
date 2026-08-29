from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from matchnote.celery import app
from matches.tasks import _run_command_with_lock, sync_calendar_long


@override_settings(CELERY_BROKER_URL='redis://redis:6379/0')
class SyncTaskTests(SimpleTestCase):
    @patch('matches.tasks.Redis.from_url')
    @patch('matches.tasks.call_command')
    def test_command_runs_once_and_releases_lock(self, call_command, from_url):
        lock = Mock()
        lock.acquire.return_value = True
        from_url.return_value.lock.return_value = lock

        result = _run_command_with_lock(
            'sync_matches',
            lock_timeout=60,
            days_ahead=1,
        )

        from_url.assert_called_once_with('redis://redis:6379/0')
        from_url.return_value.lock.assert_called_once_with(
            'matchnote:sync-lock:sync_matches',
            timeout=60,
        )
        lock.acquire.assert_called_once_with(blocking=False)
        call_command.assert_called_once_with('sync_matches', days_ahead=1)
        lock.release.assert_called_once_with()
        self.assertEqual(result['status'], 'completed')

    @patch('matches.tasks.Redis.from_url')
    @patch('matches.tasks.call_command')
    def test_command_is_skipped_when_lock_is_held(self, call_command, from_url):
        lock = Mock()
        lock.acquire.return_value = False
        from_url.return_value.lock.return_value = lock

        result = _run_command_with_lock('sync_matches', lock_timeout=60)

        call_command.assert_not_called()
        lock.release.assert_not_called()
        self.assertEqual(result['status'], 'skipped')

    @patch('matches.tasks.Redis.from_url')
    @patch('matches.tasks.call_command')
    def test_lock_is_released_when_command_fails(self, call_command, from_url):
        lock = Mock()
        lock.acquire.return_value = True
        from_url.return_value.lock.return_value = lock
        call_command.side_effect = RuntimeError('sync failed')

        with self.assertRaisesMessage(RuntimeError, 'sync failed'):
            _run_command_with_lock('sync_matches', lock_timeout=60)

        lock.release.assert_called_once_with()

    @patch('matches.tasks._run_command_with_lock')
    def test_long_calendar_task_uses_expected_command_options(self, run_command):
        sync_calendar_long.run()

        run_command.assert_called_once_with(
            'sync_matches',
            lock_timeout=3700,
            days_ahead=21,
        )

    def test_beat_schedule_contains_every_sync_task(self):
        scheduled_tasks = {
            entry['task'] for entry in app.conf.beat_schedule.values()
        }

        self.assertEqual(
            scheduled_tasks,
            {
                'matches.sync_calendar_long',
                'matches.sync_calendar_nearby',
                'matches.sync_squads_long',
                'matches.sync_squads_nearby',
                'matches.sync_live_scores',
                'matches.sync_lineups',
                'matches.calculate_pronostic_points',
            },
        )

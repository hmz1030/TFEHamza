import time
from datetime import timedelta

from django.conf import settings
from django.core.management import BaseCommand, call_command
from django.utils import timezone


class Command(BaseCommand):
    help = "Lance un scheduler local pour les synchronisations MatchNote"

    def add_arguments(self, parser):
        parser.add_argument(
            '--tick-seconds',
            type=int,
            default=30,
            help='Delai entre deux checks du scheduler (defaut : 30s)',
        )

    def handle(self, *args, **options):
        if not settings.ENABLE_SYNC_SCHEDULER:
            self.stdout.write(
                self.style.WARNING('Scheduler desactive (ENABLE_SYNC_SCHEDULER=false).')
            )
            return

        tick_seconds = max(5, options['tick_seconds'])
        last_runs = {}

        self.stdout.write(self.style.SUCCESS(
            f"Scheduler sync demarre en mode {settings.APP_MODE} "
        ))

        try:
            while True:
                now = timezone.localtime()
                self._run_due_jobs(now, last_runs)
                time.sleep(tick_seconds)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Scheduler sync arrete.'))

    def _run_due_jobs(self, now, last_runs):
        self._run_daily_after(
            key='calendar_21d',
            now=now,
            last_runs=last_runs,
            hour=3,
            command='sync_matches',
            days_ahead=21,
        )

        self._run_daily_after(
            key='squads_21d',
            now=now,
            last_runs=last_runs,
            hour=4,
            command='sync_squads',
            upcoming_days=21,
        )

        if 8 <= now.hour <= 23:
            self._run_every(
                key='calendar_2d',
                now=now,
                last_runs=last_runs,
                interval=timedelta(hours=3),
                command='sync_matches',
                days_ahead=1,
            )
            # Squads = infos lentes (poste/numero/age), donc ptit rattrapage suffit.
            self._run_every(
                key='squads_2d',
                now=now,
                last_runs=last_runs,
                interval=timedelta(hours=6),
                command='sync_squads',
                upcoming_days=2,
            )

        self._run_every(
            key='live_scores',
            now=now,
            last_runs=last_runs,
            interval=timedelta(minutes=1),
            command='sync_live_scores',
        )
        self._run_every(
            key='lineups',
            now=now,
            last_runs=last_runs,
            interval=timedelta(minutes=10),
            command='sync_lineups',
        )
        self._run_every(
            key='pronostic_points',
            now=now,
            last_runs=last_runs,
            interval=timedelta(minutes=15),
            command='calculate_pronostic_points',
        )

    def _run_daily_after(self, key, now, last_runs, hour, command, **kwargs):
        if now.hour < hour or last_runs.get(key) == now.date():
            return
        if self._safe_call(command, **kwargs):
            last_runs[key] = now.date()

    def _run_every(self, key, now, last_runs, interval, command, **kwargs):
        last_run = last_runs.get(key)
        if last_run and now - last_run < interval:
            return
        if self._safe_call(command, **kwargs):
            last_runs[key] = now

    def _safe_call(self, command, **kwargs):
        label = f"{command} {kwargs}" if kwargs else command
        self.stdout.write(f"[sync] {label}")
        try:
            call_command(command, **kwargs)
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"[sync] {label} -> erreur : {exc}"))
            return False
        return True

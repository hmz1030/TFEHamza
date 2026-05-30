from io import StringIO

from django.core.management import call_command
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .common import sync_endpoints_enabled


class DevSyncMatchesView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode developpement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        target_date = request.data.get('date')
        days_ahead = request.data.get('days_ahead', 0)

        if target_date and not parse_date(target_date):
            return Response(
                {'detail': 'Le format de date attendu est YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            days_ahead = int(days_ahead)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'days_ahead doit etre un entier.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if days_ahead < 0 or days_ahead > 21:
            return Response(
                {'detail': 'days_ahead doit etre compris entre 0 et 21.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = parse_date(target_date) if target_date else timezone.now().date()
            command_kwargs = {
                'stdout': stdout,
                'date': start_date.isoformat(),
                'days_ahead': days_ahead,
            }
            if request.data.get('delete_missing'):
                command_kwargs['delete_missing'] = True
            call_command('sync_matches', **command_kwargs)
        except Exception as exc:
            return Response(
                {
                    'detail': 'La synchronisation des matchs a echoue.',
                    'error': str(exc),
                    'output': stdout.getvalue(),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'detail': 'Synchronisation terminee.',
                'output': stdout.getvalue(),
            },
            status=status.HTTP_200_OK,
        )


class DevSyncLiveScoresView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode developpement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        target_date = request.data.get('date')
        if target_date and not parse_date(target_date):
            return Response(
                {'detail': 'Le format de date attendu est YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if target_date:
            command_kwargs['date'] = target_date
        if request.data.get('force'):
            command_kwargs['force'] = True

        try:
            call_command('sync_live_scores', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'Le refresh live a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Refresh live termine.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )


class DevSyncLineupsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode developpement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        if request.data.get('match_id'):
            command_kwargs['match_id'] = request.data['match_id']
        if request.data.get('all'):
            command_kwargs['all'] = True
        if request.data.get('window_before_hours') is not None:
            command_kwargs['window_before_hours'] = int(request.data['window_before_hours'])
        if request.data.get('recent_hours') is not None:
            command_kwargs['recent_hours'] = int(request.data['recent_hours'])

        try:
            call_command('sync_lineups', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'La sync des lineups a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Sync des lineups terminee.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )


class DevSyncSquadsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode developpement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        if request.data.get('team_api_id'):
            command_kwargs['team_api_id'] = request.data['team_api_id']
        if request.data.get('match_id'):
            command_kwargs['match_id'] = int(request.data['match_id'])
        if request.data.get('league'):
            command_kwargs['league'] = request.data['league']
        if request.data.get('all'):
            command_kwargs['all'] = True

        try:
            call_command('sync_squads', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'La sync des squads a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Sync des squads terminee.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )

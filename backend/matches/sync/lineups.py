from django.utils import timezone

from matches.models import MatchPlayer, Player
from matches.sync.http import api_get


def fetch_lineups(match_api_id):
    return api_get('lineups.php', {'match_id': match_api_id})


def fetch_match_details(match_api_id):
    return api_get('live_match_details.php', {'match_id': match_api_id})


def get_player_api_id(raw_player):
    return str((raw_player or {}).get('id') or '').strip()


def get_empty_event_summary():
    return {
        'goals': 0,
        'assists': 0,
        'subbed_in': False,
        'subbed_out': False,
    }


def build_event_summary(events):
    """Resume les buts, assists et remplacements par api_id joueur."""
    summary = {}

    def stats_for(raw_player):
        pid = get_player_api_id(raw_player)
        if not pid:
            return None
        return summary.setdefault(pid, get_empty_event_summary())

    for event in events or []:
        event_type = event.get('type', '').lower()
        detail = event.get('detail') or {}

        if event_type == 'goal':
            scorer_stats = stats_for(detail.get('player'))
            if scorer_stats is not None:
                scorer_stats['goals'] += 1

            assist_stats = stats_for(detail.get('assist'))
            if assist_stats is not None:
                assist_stats['assists'] += 1

        if event_type == 'substitution':
            in_stats = stats_for(detail.get('in'))
            if in_stats is not None:
                in_stats['subbed_in'] = True

            out_stats = stats_for(detail.get('out'))
            if out_stats is not None:
                out_stats['subbed_out'] = True

    return summary


def get_sub_in_ids(events):
    """Extrait les api_id des remplacants effectivement entres en jeu."""
    sub_in_ids = set()
    for event in events or []:
        if event.get('type', '').lower() != 'substitution':
            continue
        detail = event.get('detail') or {}
        pid = get_player_api_id(detail.get('in'))
        if pid:
            sub_in_ids.add(pid)
    return sub_in_ids


def players_who_played(side_data, sub_in_ids):
    """Retourne titulaires + seulement les remplacants entres en jeu."""
    players = []
    for raw in side_data.get('starting') or []:
        players.append({**raw, 'is_starter': True})
    for raw in side_data.get('subs') or []:
        pid = get_player_api_id(raw)
        if pid in sub_in_ids:
            players.append({**raw, 'is_starter': False})
    return players


def ensure_players(team, raw_players):
    """Cree/maj les Player et renvoie la liste de triplets (Team, Player, raw_player)."""
    pairs = []
    for raw_player in raw_players:
        api_id = str(raw_player.get('id') or '').strip()
        name = (raw_player.get('name') or '').strip()
        if not api_id or not name:
            continue
        image = (raw_player.get('image') or '').strip()
        player, _ = Player.objects.update_or_create(
            api_id=api_id,
            defaults={'name': name, 'team': team, 'image': image},
        )
        pairs.append((team, player, raw_player))
    return pairs


def sync_match_players(match, pairs, event_summary):
    """Synchronise MatchPlayer a partir d'une liste de (Team, Player, raw_player)."""
    players = [pair[1] for pair in pairs]
    MatchPlayer.objects.filter(match=match).exclude(player__in=players).delete()
    for team, player, raw in pairs:
        stats = event_summary.get(player.api_id, get_empty_event_summary())
        MatchPlayer.objects.update_or_create(
            match=match,
            player=player,
            defaults={
                'team': team,
                'is_starter': bool(raw.get('is_starter')),
                'goals': stats['goals'],
                'assists': stats['assists'],
                'subbed_in': stats['subbed_in'] or not bool(raw.get('is_starter')),
                'subbed_out': stats['subbed_out'],
            },
        )


def sync_lineup_for_match(match):
    """Synchronise les joueurs d'un match (titulaires + subs entres en jeu)."""
    lineups = fetch_lineups(match.api_id)
    if not lineups or not lineups.get('home') or not lineups.get('away'):
        return None

    details = fetch_match_details(match.api_id)
    events = (details or {}).get('events') or []
    event_summary = build_event_summary(events)
    sub_in_ids = get_sub_in_ids(events)

    home_played = players_who_played(lineups['home'], sub_in_ids)
    away_played = players_who_played(lineups['away'], sub_in_ids)

    home_pairs = ensure_players(match.home_team, home_played)
    away_pairs = ensure_players(match.away_team, away_played)
    all_pairs = home_pairs + away_pairs

    sync_match_players(match, all_pairs, event_summary)

    match.lineup_synced_at = timezone.now()
    match.save(update_fields=['lineup_synced_at'])

    return len(all_pairs)

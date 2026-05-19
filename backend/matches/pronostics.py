from matches.models import Pronostic


def is_finished_status(status):
    value = (status or '').strip().lower()
    return 'finish' in value or 'term' in value or value in {'ft', 'aet', 'pen'}


def get_result(home_score, away_score):
    if home_score > away_score:
        return 'home'
    if away_score > home_score:
        return 'away'
    return 'draw'


def calculate_pronostic_points(pronostic):
    match = pronostic.match
    if pronostic.home_score == match.home_score and pronostic.away_score == match.away_score:
        return 3

    predicted_result = get_result(pronostic.home_score, pronostic.away_score)
    actual_result = get_result(match.home_score, match.away_score)
    if predicted_result == actual_result:
        return 1

    return 0


def update_pronostic_points(match_id=None, target_date=None):
    pronostics = Pronostic.objects.select_related('match', 'user')
    if match_id is not None:
        pronostics = pronostics.filter(match_id=match_id)
    if target_date is not None:
        pronostics = pronostics.filter(match__date__date=target_date)

    updated_count = 0
    skipped_count = 0
    for pronostic in pronostics:
        if not is_finished_status(pronostic.match.status):
            skipped_count += 1
            continue

        points = calculate_pronostic_points(pronostic)
        if pronostic.points != points:
            pronostic.points = points
            pronostic.save(update_fields=['points'])
            updated_count += 1

    return {'updated': updated_count, 'skipped': skipped_count}

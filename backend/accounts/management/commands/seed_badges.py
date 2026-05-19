from django.core.management.base import BaseCommand
from django.db.models import Count

from accounts.models import Badge, User


BADGES = (
    {'name': 'Débutant', 'min_rated_match': 0},
    {'name': 'Supporter', 'min_rated_match': 25},
    {'name': 'Analyste', 'min_rated_match': 50},
    {'name': 'GOAT', 'min_rated_match': 100},
)


class Command(BaseCommand):
    help = 'Cree ou met a jour les badges utilisateur.'

    def handle(self, *args, **options):
        badge_by_threshold = {}

        for badge_data in BADGES:
            badge, created = Badge.objects.update_or_create(
                name=badge_data['name'],
                defaults={
                    'min_rated_match': badge_data['min_rated_match'],
                    'icon': '',
                },
            )
            badge_by_threshold[badge.min_rated_match] = badge
            action = 'cree' if created else 'mis a jour'
            self.stdout.write(f"Badge {badge.name} {action}.")

        users = User.objects.annotate(ratings_count=Count('ratings')).order_by('id')
        updated_users = 0

        for user in users:
            best_badge = None
            for threshold, badge in sorted(badge_by_threshold.items(), reverse=True):
                if user.ratings_count >= threshold:
                    best_badge = badge
                    break

            if best_badge and user.badge_id != best_badge.id:
                user.badge = best_badge
                user.save(update_fields=['badge'])
                updated_users += 1

        self.stdout.write(self.style.SUCCESS(f'{updated_users} utilisateur(s) mis a jour.'))

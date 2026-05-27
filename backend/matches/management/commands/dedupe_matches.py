from django.core.management.base import BaseCommand

from matches.match_records import dedupe_matches_by_natural_key


class Command(BaseCommand):
    help = 'Fusionne les matchs dupliques ayant la meme date, ligue et equipes.'

    def handle(self, *args, **options):
        merged = dedupe_matches_by_natural_key()
        if merged:
            self.stdout.write(self.style.SUCCESS(f'{merged} match(s) duplique(s) fusionne(s).'))
        else:
            self.stdout.write('Aucun doublon de match trouve.')

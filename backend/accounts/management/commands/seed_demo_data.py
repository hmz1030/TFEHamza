from random import Random

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from accounts.models import Badge, FavoriteClub, Follow, User
from matches.models import (
    Comment,
    CommentReaction,
    Match,
    Pronostic,
    PronosticGroup,
    PronosticGroupMember,
    Rating,
    Team,
    Vote,
)
from matches.pronostics import calculate_pronostic_points, is_finished_status


DEFAULT_PASSWORD = 'Demo123!'

DEMO_NAMES = (
    ('Amine', 'Benkara'),
    ('Sarah', 'Moreau'),
    ('Yanis', 'Diallo'),
    ('Lina', 'Rossi'),
    ('Noah', 'Petit'),
    ('Ines', 'Martins'),
    ('Mehdi', 'Farah'),
    ('Nour', 'Saidi'),
    ('Elias', 'Renard'),
    ('Leila', 'Dupont'),
    ('Sami', 'Kacem'),
    ('Maya', 'Fontaine'),
    ('Adam', 'Morel'),
    ('Sofia', 'Leroy'),
    ('Rayan', 'Nguyen'),
    ('Jade', 'Lambert'),
    ('Nora', 'Simon'),
    ('Ilias', 'Garcia'),
    ('Camille', 'Bernard'),
    ('Hugo', 'Mercier'),
    ('Lou', 'Robert'),
    ('Zakaria', 'Ait'),
    ('Emma', 'Fischer'),
    ('Ayoub', 'Haddad'),
    ('Clara', 'Lopez'),
    ('Nabil', 'Chevalier'),
    ('Salma', 'Da Silva'),
    ('Thomas', 'Laurent'),
    ('Julia', 'Perrot'),
    ('Karim', 'Bailly'),
    ('Manon', 'Legrand'),
    ('Omar', 'Vidal'),
    ('Eva', 'Carpentier'),
    ('Malik', 'Henry'),
    ('Chloe', 'Barbier'),
    ('Lucas', 'Gauthier'),
    ('Amina', 'Colin'),
    ('Theo', 'Masson'),
    ('Mina', 'Boyer'),
    ('Sacha', 'Perrin'),
    ('Imane', 'Robin'),
    ('Enzo', 'Faure'),
    ('Nadia', 'Blanc'),
    ('Kylian', 'Meyer'),
    ('Rim', 'Giraud'),
    ('Alexis', 'Andre'),
    ('Aya', 'Lemoine'),
    ('Bastien', 'Roux'),
    ('Myriam', 'Girard'),
    ('Mathis', 'Brun'),
)

BIOS = (
    'Analyse les matchs avec le coeur et un peu de data.',
    'Toujours pret a defendre son onze ideal.',
    'Specialiste des notes severes apres les grosses affiches.',
    'Regarde surtout les milieux qui cassent les lignes.',
    'Supporter calme, pronostiqueur beaucoup moins calme.',
    'Fan des jeunes talents et des matchs du dimanche soir.',
    'Cherche le bon MVP avant tout le monde.',
    'Commente les temps faibles autant que les buts.',
)

RATING_COMMENTS = (
    'Match solide, mais il manquait un vrai changement de rythme.',
    'Le score ne raconte pas tout, il y avait beaucoup de maitrise.',
    'Tres bon pressing en premiere periode, plus complique ensuite.',
    'Jai trouve le match intense, surtout dans les duels.',
    'Belle reaction apres louverture du score.',
    'Trop de dechets techniques pour viser plus haut.',
    'Le plan de jeu etait clair et plutot bien execute.',
    'Quelques choix discutables, mais le spectacle etait la.',
)

COMMENT_TEMPLATES = (
    'Sur {home} - {away}, le milieu a vraiment change le match.',
    'Je ne comprends pas pourquoi {home} a autant recule apres la pause.',
    '{away} a mieux fini physiquement, ca sest vu dans les transitions.',
    'Le MVP devrait etre un joueur qui a pese sans ballon aussi.',
    'Ce match va compter dans la dynamique des deux equipes.',
    'Le resultat est logique, meme si les dernieres minutes etaient folles.',
    'La difference sest faite sur les details dans les zones decisives.',
    'Je garde surtout la qualite des sorties de balle.',
)

REPLY_TEMPLATES = (
    'Je suis assez daccord, surtout sur la deuxieme mi-temps.',
    'Pas totalement, je trouve que le banc a aussi change la dynamique.',
    'Oui, et les notes devraient le refleter.',
    'Le contexte du calendrier joue beaucoup aussi.',
    'Bonne analyse, javais rate ce detail pendant le direct.',
    'Pour moi le tournant arrive un peu plus tot dans le match.',
)

GROUP_NAMES = (
    'Ligue des analystes',
    'Debat du dimanche',
    'Pronos entre potes',
    'Salon des tacticiens',
    'Course au podium',
)


class Command(BaseCommand):
    help = 'Cree des utilisateurs demo avec activite sociale et sportive.'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=50)
        parser.add_argument('--password', default=DEFAULT_PASSWORD)
        parser.add_argument('--prefix', default='demo_')
        parser.add_argument('--seed', type=int, default=20260517)
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Supprime les comptes demo existants avant de les recreer.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count = max(1, options['users'])
        prefix = options['prefix']
        password = options['password']
        rng = Random(options['seed'])

        if options['reset']:
            deleted_count, _ = User.objects.filter(username__startswith=prefix).delete()
            self.stdout.write(f'{deleted_count} objet(s) demo supprime(s).')

        users = self.create_users(count, prefix, password, rng)
        self.clean_demo_activity(users)

        teams = list(Team.objects.order_by('name')[:100])
        matches = list(
            Match.objects.select_related('home_team', 'away_team')
            .prefetch_related('match_players__player')
            .order_by('-date')[:80]
        )

        stats = {
            'users': len(users),
            'follows': self.create_follows(users, rng),
            'favorite_clubs': self.create_favorite_clubs(users, teams, rng),
            'ratings': 0,
            'comments': 0,
            'comment_reactions': 0,
            'pronostics': 0,
            'votes': 0,
            'groups': 0,
        }

        if matches:
            stats['ratings'] = self.create_ratings(users, matches, rng)
            comments = self.create_comments(users, matches, rng)
            stats['comments'] = len(comments)
            stats['comment_reactions'] = self.create_comment_reactions(users, comments, rng)
            stats['pronostics'] = self.create_pronostics(users, matches, rng)
            stats['votes'] = self.create_votes(users, matches, rng)
            stats['groups'] = self.create_pronostic_groups(users, rng)
            self.assign_badges(users)
        else:
            self.stdout.write(self.style.WARNING('Aucun match trouve: activite match non creee.'))

        self.stdout.write(self.style.SUCCESS('Donnees demo creees.'))
        self.stdout.write(f'Comptes: {stats["users"]} utilisateur(s), mot de passe: {password}')
        self.stdout.write(
            'Activite: '
            f'{stats["follows"]} follows, '
            f'{stats["favorite_clubs"]} clubs favoris, '
            f'{stats["ratings"]} notes, '
            f'{stats["comments"]} commentaires, '
            f'{stats["comment_reactions"]} reactions, '
            f'{stats["pronostics"]} pronostics, '
            f'{stats["votes"]} votes MVP, '
            f'{stats["groups"]} groupes.'
        )

    def create_users(self, count, prefix, password, rng):
        users = []

        for index in range(count):
            first_name, last_name = DEMO_NAMES[index % len(DEMO_NAMES)]
            username = f'{prefix}{index + 1:02d}_{first_name.lower()}'
            bio = rng.choice(BIOS)

            user, _ = User.objects.update_or_create(
                username=username,
                defaults={
                    'email': f'{username}@matchnote.test',
                    'first_name': first_name,
                    'last_name': last_name,
                    'bio': bio,
                    'is_staff': False,
                    'is_superuser': False,
                },
            )
            user.set_password(password)
            user.save(update_fields=['password'])
            users.append(user)

        return users

    def clean_demo_activity(self, users):
        if not users:
            return

        user_ids = [user.id for user in users]
        demo_comments = Comment.objects.filter(user_id__in=user_ids)

        CommentReaction.objects.filter(Q(user_id__in=user_ids) | Q(comment__in=demo_comments)).delete()
        demo_comments.delete()
        Rating.objects.filter(user_id__in=user_ids).delete()
        Vote.objects.filter(user_id__in=user_ids).delete()
        Pronostic.objects.filter(user_id__in=user_ids).delete()
        PronosticGroup.objects.filter(owner_id__in=user_ids).delete()
        PronosticGroupMember.objects.filter(user_id__in=user_ids).delete()
        Follow.objects.filter(follower_id__in=user_ids).delete()
        FavoriteClub.objects.filter(user_id__in=user_ids).delete()

    def create_follows(self, users, rng):
        created = 0

        for index, user in enumerate(users):
            followees = {users[(index + offset) % len(users)] for offset in range(1, 5)}
            followees.update(rng.sample(users, min(len(users), rng.randint(3, 7))))

            for followee in followees:
                if followee.id == user.id:
                    continue
                _, was_created = Follow.objects.get_or_create(follower=user, followee=followee)
                created += int(was_created)

        return created

    def create_favorite_clubs(self, users, teams, rng):
        if not teams:
            return 0

        created = 0
        for user in users:
            clubs = rng.sample(teams, min(len(teams), rng.randint(1, 2)))
            for team in clubs:
                _, was_created = FavoriteClub.objects.get_or_create(user=user, team=team)
                created += int(was_created)

        return created

    def create_ratings(self, users, matches, rng):
        finished_matches = [match for match in matches if is_finished_status(match.status)]
        rating_matches = finished_matches or matches
        created = 0

        for user in users:
            sample_size = min(len(rating_matches), rng.randint(6, 12))
            for match in rng.sample(rating_matches, sample_size):
                score = rng.choice((5, 6, 6, 7, 7, 8, 8, 9, 10))
                Rating.objects.update_or_create(
                    user=user,
                    match=match,
                    defaults={
                        'score': score,
                        'comment': rng.choice(RATING_COMMENTS),
                    },
                )
                created += 1

        return created

    def create_comments(self, users, matches, rng):
        parent_comments = []
        all_comments = []

        for user in users:
            sample_size = min(len(matches), rng.randint(4, 7))
            for match in rng.sample(matches, sample_size):
                content = rng.choice(COMMENT_TEMPLATES).format(
                    home=match.home_team.name,
                    away=match.away_team.name,
                )
                comment = Comment.objects.create(user=user, match=match, content=content)
                parent_comments.append(comment)
                all_comments.append(comment)

        for parent in parent_comments:
            if rng.random() > 0.58:
                continue

            reply_count = rng.randint(1, 2)
            candidates = [user for user in users if user.id != parent.user_id]
            for replier in rng.sample(candidates, min(len(candidates), reply_count)):
                reply = Comment.objects.create(
                    user=replier,
                    match=parent.match,
                    parent=parent,
                    content=rng.choice(REPLY_TEMPLATES),
                )
                all_comments.append(reply)

        return all_comments

    def create_comment_reactions(self, users, comments, rng):
        created = 0

        for comment in comments:
            candidates = [user for user in users if user.id != comment.user_id]
            reaction_count = min(len(candidates), rng.randint(3, 10))

            for user in rng.sample(candidates, reaction_count):
                value = CommentReaction.LIKE if rng.random() < 0.78 else CommentReaction.DISLIKE
                _, was_created = CommentReaction.objects.get_or_create(
                    user=user,
                    comment=comment,
                    defaults={'value': value},
                )
                created += int(was_created)

        return created

    def create_pronostics(self, users, matches, rng):
        created = 0

        for user in users:
            sample_size = min(len(matches), rng.randint(8, 14))
            for match in rng.sample(matches, sample_size):
                home_score, away_score = self.pick_prediction(match, rng)
                pronostic, _ = Pronostic.objects.update_or_create(
                    user=user,
                    match=match,
                    defaults={
                        'home_score': home_score,
                        'away_score': away_score,
                        'points': None,
                    },
                )

                if is_finished_status(match.status):
                    pronostic.points = calculate_pronostic_points(pronostic)
                    pronostic.save(update_fields=['points'])

                created += 1

        return created

    def pick_prediction(self, match, rng):
        if is_finished_status(match.status):
            exact_score = rng.random() < 0.22
            if exact_score:
                return match.home_score, match.away_score

            home_score = max(0, match.home_score + rng.choice((-1, 0, 1)))
            away_score = max(0, match.away_score + rng.choice((-1, 0, 1)))
            return home_score, away_score

        return rng.randint(0, 4), rng.randint(0, 4)

    def create_votes(self, users, matches, rng):
        votable_matches = [match for match in matches if match.match_players.all()]
        created = 0

        if not votable_matches:
            self.stdout.write(self.style.WARNING('Aucune composition trouvee: votes MVP non crees.'))
            return created

        for user in users:
            sample_size = min(len(votable_matches), rng.randint(4, 9))
            for match in rng.sample(votable_matches, sample_size):
                match_players = list(match.match_players.all())
                player = rng.choice(match_players).player
                Vote.objects.update_or_create(
                    user=user,
                    match=match,
                    defaults={'player': player},
                )
                created += 1

        return created

    def create_pronostic_groups(self, users, rng):
        created = 0
        now = timezone.now()

        for index, name in enumerate(GROUP_NAMES):
            owner = users[index % len(users)]
            group, was_created = PronosticGroup.objects.update_or_create(
                name=f'Demo - {name}',
                defaults={'owner': owner},
            )
            created += int(was_created)

            members = rng.sample(users, min(len(users), rng.randint(8, 16)))
            if owner not in members:
                members.append(owner)

            for member in members:
                status = PronosticGroupMember.ACCEPTED
                if member != owner:
                    status = rng.choice(
                        (
                            PronosticGroupMember.ACCEPTED,
                            PronosticGroupMember.ACCEPTED,
                            PronosticGroupMember.ACCEPTED,
                            PronosticGroupMember.PENDING,
                        )
                    )

                PronosticGroupMember.objects.update_or_create(
                    group=group,
                    user=member,
                    defaults={
                        'invited_by': owner,
                        'status': status,
                        'responded_at': now if status != PronosticGroupMember.PENDING else None,
                    },
                )

        return created

    def assign_badges(self, users):
        badges = list(Badge.objects.order_by('-min_rated_match'))

        if not badges:
            return

        for user in users:
            ratings_count = Rating.objects.filter(user=user).count()
            badge = next(
                (candidate for candidate in badges if ratings_count >= candidate.min_rated_match),
                None,
            )

            if badge and user.badge_id != badge.id:
                user.badge = badge
                user.save(update_fields=['badge'])

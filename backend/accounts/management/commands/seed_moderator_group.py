from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from matches.models import Comment, CommentReaction, CommentReport


GROUP_NAME = 'Moderateurs'


class Command(BaseCommand):
    help = 'Cree le groupe moderateur avec les permissions de moderation.'

    def handle(self, *args, **options):
        group, created = Group.objects.get_or_create(name=GROUP_NAME)

        permission_specs = (
            (Comment, ('view_comment', 'delete_comment')),
            (CommentReaction, ('view_commentreaction', 'delete_commentreaction')),
            (CommentReport, ('view_commentreport', 'change_commentreport', 'delete_commentreport')),
        )

        permissions = []
        for model, codenames in permission_specs:
            content_type = ContentType.objects.get_for_model(model)
            permissions.extend(
                Permission.objects.filter(content_type=content_type, codename__in=codenames)
            )

        group.permissions.set(permissions)

        action = 'cree' if created else 'mis a jour'
        self.stdout.write(self.style.SUCCESS(f'Groupe {GROUP_NAME} {action} avec {len(permissions)} permissions.'))

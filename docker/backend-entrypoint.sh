#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "Waiting for postgres..."
  sleep 1
done

if [ "$RUN_STARTUP_TASKS" = "true" ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput
  python manage.py seed_badges
  python manage.py seed_moderator_group
fi

exec "$@"

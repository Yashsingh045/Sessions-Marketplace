#!/bin/sh
set -e

echo "Waiting for Postgres at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
until python -c "import socket,os,sys; s=socket.socket(); s.settimeout(2); \
  sys.exit(0) if not s.connect_ex((os.environ.get('POSTGRES_HOST','db'), int(os.environ.get('POSTGRES_PORT','5432')))) else sys.exit(1)" 2>/dev/null; do
  echo "  ...db not ready, retrying"
  sleep 2
done
echo "Postgres is up."

python manage.py migrate --noinput
python manage.py createcachetable || true
python manage.py collectstatic --noinput || true

# Optional demo seed (idempotent). Toggle with SEED_DEMO_DATA in .env.
case "${SEED_DEMO_DATA:-false}" in
  [Tt]rue|1|yes) python manage.py seed_demo || true ;;
esac

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3

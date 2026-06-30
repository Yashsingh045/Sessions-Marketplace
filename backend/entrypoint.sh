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
python manage.py collectstatic --noinput || true

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3

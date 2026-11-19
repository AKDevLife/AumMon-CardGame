#!/usr/bin/env bash
# Applies supabase/migrations/*.sql to a FRESH local database, then runs pgTAP tests.
# Never point DATABASE_URL at a cloud/production database.
#   Local:  pnpm db:test          (starts a disposable supabase/postgres container)
#   CI:     DATABASE_URL=... bash scripts/db-test.sh
set -euo pipefail

IMAGE="supabase/postgres:17.6.1.054"
CONTAINER=""

cleanup() { [[ -n "$CONTAINER" ]] && docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

if [[ -z "${DATABASE_URL:-}" ]]; then
  CONTAINER="aummon-db-test-$$"
  docker run -d --rm --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -p 127.0.0.1::5432 "$IMAGE" >/dev/null
  PORT="$(docker port "$CONTAINER" 5432/tcp | head -1 | sed 's/.*://')"
  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres"
fi

case "$DATABASE_URL" in
  *127.0.0.1*|*localhost*) ;;
  *) echo "Refusing to run against non-local database" >&2; exit 1 ;;
esac

echo "Waiting for database..."
for _ in $(seq 1 60); do
  psql "$DATABASE_URL" -tAc "select 1 from pg_roles where rolname = 'authenticated'" 2>/dev/null | grep -q 1 && break
  sleep 2
done

for f in supabase/migrations/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done

if [[ -f supabase/seed.sql ]]; then
  echo "Applying supabase/seed.sql (twice, to check idempotency)"
  psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/seed.sql >/dev/null
  psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/seed.sql >/dev/null
fi

status=0
for t in supabase/tests/database/*.test.sql; do
  out="$(psql "$DATABASE_URL" -X -q -t -A -v ON_ERROR_STOP=1 -f "$t" 2>&1)" || status=1
  passed="$(grep -c '^ok' <<<"$out" || true)"
  if grep -qE '^not ok|^# Looks like|ERROR' <<<"$out"; then status=1; fi
  echo "$t: $passed passed"
  grep -E '^not ok|^# |ERROR' <<<"$out" || true
done

[[ $status -eq 0 ]] && echo "Database tests passed." || echo "Database tests FAILED." >&2
exit $status

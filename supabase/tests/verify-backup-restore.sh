#!/usr/bin/env bash
# Disposable native CI only. This is NOT a Supabase project recovery command.
set -eu
test "${GITHUB_ACTIONS:-}" = "true"
test "${PGDATABASE:-}" = "uniloop_notifications_ci"
case "${PGHOST:-}" in localhost|127.0.0.1) ;; *) exit 2 ;; esac
test -n "${RUNNER_TEMP:-}"
umask 077
dump_path=$(mktemp "${RUNNER_TEMP}/uniloop-fixture-XXXXXX.dump")
trap 'rm -f "$dump_path"' EXIT
source_snapshot=$(psql -X -qAt -v ON_ERROR_STOP=1 -f supabase/tests/21_restore_snapshot.sql)
pg_dump --format=custom --file="$dump_path"
createdb uniloop_restore_ci
pg_restore --exit-on-error --dbname=uniloop_restore_ci "$dump_path"
restored_snapshot=$(psql -X -qAt -d uniloop_restore_ci -v ON_ERROR_STOP=1 -f supabase/tests/21_restore_snapshot.sql)
if test "$source_snapshot" != "$restored_snapshot"; then
 echo "Restored fixture row hashes/counts differ" >&2
 exit 1
fi
psql -X -q -d uniloop_restore_ci -v ON_ERROR_STOP=1 -f supabase/tests/11_backend_security_contract.sql
psql -X -q -d uniloop_restore_ci -v ON_ERROR_STOP=1 -f supabase/tests/14_marketplace_full_text_search.sql
echo "Fixture backup/restore: row hashes, authorization and indexed search verified."

#!/bin/bash -e

# Choix du dossier host pour stocker les dumps
HOST_TMP_DIR="/tmp/fcu"

# Detect OS and set LOCALHOST accordingly
if [[ "$OSTYPE" == "msys"* ]]; then
  # Chemin Windows réel pour Docker (ex: C:/Users/.../Temp/fcu)
  DOCKER_HOST_TMP_DIR="$(cygpath -w "$HOST_TMP_DIR" | sed 's|\\|/|g')"
  # Empêche la conversion MSYS sur les chemins /tmp/... destinés au container
  export MSYS2_ARG_CONV_EXCL="/tmp/tables.sql;/tmp/tables.dump"

else
  DOCKER_HOST_TMP_DIR="$HOST_TMP_DIR"
fi


COMMON_PG_PARAMS="-e PGUSER -e PGPASSWORD --network host -v ${DOCKER_HOST_TMP_DIR}:/tmp postgis/postgis:16-3.5-alpine"

pg_shell="docker run --rm $COMMON_PG_PARAMS sh"
pg_dump="docker run --rm $COMMON_PG_PARAMS pg_dump"
psql="docker run --rm $COMMON_PG_PARAMS psql"
pg_restore="docker run --rm $COMMON_PG_PARAMS pg_restore"

init_env() {
  ENV=$1
  shift

  if [[ $ENV != "dev" && $ENV != "prod" ]]; then
    usage
    exit 1
  fi

  DATAONLY=false
  if [[ "$1" == "--data-only" ]]; then
    DATAONLY=true
    shift
  fi

  TABLES=("$@")
  if [ ${#TABLES[@]} -eq 0 ]; then
    usage
    exit 1
  fi

  if [[ $ENV = "prod" ]]; then
    SCALINGO_APP=france-chaleur-urbaine
    DB_PORT=10001
  else
    SCALINGO_APP=france-chaleur-urbaine-dev
    DB_PORT=10000
  fi

  # fix permissions for docker volume
  mkdir -p /tmp/fcu
  chmod 777 /tmp/fcu
}

setup_tunnel() {
  if lsof -i :$DB_PORT >/dev/null 2>&1; then
    echo "Database tunnel already running on port $DB_PORT, skipping..."
    return 0
  fi

  echo "Database tunnel not running, starting it for $SCALINGO_APP on port $DB_PORT..."
  # ferme le tunnel quand ctrl-c est pressé
  trap 'kill %1' EXIT
  # ouvre un tunnel vers BDD cible
  scalingo -a $SCALINGO_APP db-tunnel -p $DB_PORT $SCALINGO_TUNNEL_ARGS SCALINGO_POSTGRESQL_URL &
  sleep 4
}

get_db_credentials() {
  POSTGRESQL_URL=$(scalingo -a $SCALINGO_APP env-get SCALINGO_POSTGRESQL_URL)
  export PGUSER=$(expr $POSTGRESQL_URL : '.*/\([^:]*\):.*')
  export PGPASSWORD=$(expr $POSTGRESQL_URL : '.*:\([^@]*\)@.*')
}

truncate_tables() {
  local database_url=$1
  shift
  local tables=("$@")
  local sql_args=""
  local first=true
  for table in "${tables[@]}"; do
    if [ "$first" = true ]; then
      sql_args="\"$table\""
      first=false
    else
      sql_args="$sql_args, \"$table\""
    fi
  done
  $psql -v ON_ERROR_STOP=1 $database_url -c "TRUNCATE TABLE $sql_args RESTART IDENTITY CASCADE;"
}

drop_tables() {
  local database_url=$1
  shift
  local tables=("$@")
  local sql_args=""
  for table in "${tables[@]}"; do
    sql_args="$sql_args DROP TABLE IF EXISTS \"$table\" CASCADE;"
  done
  $psql -v ON_ERROR_STOP=1 $database_url -c "$sql_args"
}

dump_tables() {
  local database_url=$1
  shift
  local tables=("$@")
  local table_args=()
  for table in "${tables[@]}"; do
    table_args+=("-t" "\"$table\"")
  done
  $pg_shell -c "rm -rf /tmp/tables.dump"
  $pg_dump -j 10 -Fd $database_url "${table_args[@]}" -f /tmp/tables.dump
}

restore_tables() {
  local database_url=$1
  $pg_restore -j 10 -Fd -O --clean -d $database_url /tmp/tables.dump
}

dump_tables_sql() {
  local database_url=$1
  shift
  local tables=("$@")
  local table_args=()
  for table in "${tables[@]}"; do
    table_args+=("-t" "\"$table\"")
  done
  $pg_shell -c "rm -rf /tmp/tables.sql"
  $pg_dump --data-only $database_url "${table_args[@]}" >/tmp/fcu/tables.sql
}

load_tables_in_transaction() {
  local database_url=$1
  shift
  local tables=("$@")
  local sql_args=""
  for table in "${tables[@]}"; do
    sql_args="$sql_args DELETE FROM \"$table\";"
  done
  $psql -v ON_ERROR_STOP=1 $database_url --single-transaction -c "$sql_args" -f /tmp/tables.sql
}

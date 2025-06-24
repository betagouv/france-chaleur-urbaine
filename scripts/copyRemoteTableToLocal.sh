#!/bin/bash -e

usage() {
  echo "Usage: copyRemoteTableToLocal.sh <dev|prod> [--data-only] <table_name1> [table_name2 ...]"
  echo "Used to synchronize remote tables with local tables (dropped and recreated each sync)"
  echo "Use --data-only to perform a zero downtime update (in a transaction)"
  echo "Use the env variable SCALINGO_TUNNEL_ARGS=\"-i $HOME/.ssh/keys/path_to_keys_ed\" if your SSH key is not ~/.ssh/id_rsa"
}

source "$(dirname "$0")/db_sync_common.sh"

init_env "$@"
get_db_credentials
setup_tunnel

echo "> Synchronisation des tables distante de $ENV vers la BDD locale..."

echo "Exporting data from remote $ENV database on port $DB_PORT..."
if [ $DATAONLY = true ]; then
  dump_tables_sql postgres://$DOCKER_HOST:$DB_PORT "${TABLES[@]}"
else
  dump_tables postgres://$DOCKER_HOST:$DB_PORT "${TABLES[@]}"
fi

echo "Importing data to local database..."
if [ $DATAONLY = true ]; then
  load_tables_in_transaction postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres "${TABLES[@]}"
else
  truncate_tables postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres "${TABLES[@]}"
  restore_tables postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres "${TABLES[@]}"
fi

echo "> Synchronisation terminée de $ENV -> local"

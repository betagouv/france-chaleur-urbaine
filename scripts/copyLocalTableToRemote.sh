#!/bin/bash -e

usage() {
  echo "Usage: copyLocalTableToRemote.sh <dev|prod> [--data-only] <table_name1> [table_name2 ...]"
  echo "Used to synchronize local tables with remote tables (dropped and recreated each sync)"
  echo "Use --data-only to perform a zero downtime update (in a transaction)"
  echo "Use the env variable SCALINGO_TUNNEL_ARGS=\"-i $HOME/.ssh/keys/path_to_keys_ed\" if your SSH key is not ~/.ssh/id_rsa"
}

source "$(dirname "$0")/db_sync_common.sh"

init_env "$@"
get_db_credentials
setup_tunnel

echo "> Synchronisation des tables locales vers l'environnement $env..."

echo "Exporting data from local database..."
if [ $DATAONLY = true ]; then
  dump_tables_sql postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres "${TABLES[@]}"
else
  dump_tables postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres "${TABLES[@]}"
fi

echo "Importing data to remote database $env:$DB_PORT..."
if [ $DATAONLY = true ]; then
  load_tables_in_transaction postgres://$DOCKER_HOST:$DB_PORT "${TABLES[@]}"
else
  restore_tables postgres://$DOCKER_HOST:$DB_PORT "${TABLES[@]}"
fi

echo "> Synchronisation terminée de local -> $ENV"
